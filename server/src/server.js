const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { dbRun, dbGet, dbAll, initSchema } = require('./db');
const { JWT_SECRET, authenticateToken, authorizeAdmin } = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Database Tables
initSchema().catch(console.error);

// ------------------------------------------------
// 1. AUTHENTICATION & PROFILE
// ------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existingUser = await dbGet('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await dbRun(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email.toLowerCase(), hashedPassword, 'customer']
    );

    const token = jwt.sign({ id: result.id, name, email: email.toLowerCase(), role: 'customer' }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: result.id, name, email: email.toLowerCase(), role: 'customer' }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving user profile' });
  }
});

// ------------------------------------------------
// 2. DELIVERY ADDRESS MANAGEMENT
// ------------------------------------------------

app.get('/api/addresses', authenticateToken, async (req, res) => {
  try {
    const addresses = await dbAll(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC',
      [req.user.id]
    );
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching addresses' });
  }
});

app.post('/api/addresses', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address_line, city, state, pin, country = 'India', is_default = 1 } = req.body;
    
    if (!first_name || !last_name || !phone || !address_line || !city || !state || !pin) {
      return res.status(400).json({ message: 'All required address fields must be filled' });
    }

    if (is_default) {
      await dbRun('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    const result = await dbRun(
      `INSERT INTO addresses (user_id, first_name, last_name, email, phone, address_line, city, state, pin, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, first_name, last_name, email || req.user.email, phone, address_line, city, state, pin, country, is_default ? 1 : 0]
    );

    res.status(201).json({ id: result.id, message: 'Address saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving address', error: err.message });
  }
});

// ------------------------------------------------
// 3. CATALOG & BOOKS (Search, Filters, Categorization)
// ------------------------------------------------

app.get('/api/books', async (req, res) => {
  try {
    const { search, category, language, format, price_range, sort } = req.query;
    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (title LIKE ? OR author LIKE ? OR description LIKE ? OR tags LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category && category !== 'All') {
      query += ' AND (category = ? OR sub_category = ?)';
      params.push(category, category);
    }

    if (language && language !== 'All') {
      query += ' AND language = ?';
      params.push(language);
    }

    if (format && format !== 'All') {
      query += ' AND format LIKE ?';
      params.push(`%${format}%`);
    }

    if (price_range && price_range !== 'All') {
      if (price_range === 'under_200') {
        query += ' AND price < 200';
      } else if (price_range === '200_400') {
        query += ' AND price >= 200 AND price <= 400';
      } else if (price_range === 'above_400') {
        query += ' AND price > 400';
      }
    }

    if (sort === 'price_asc') {
      query += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY price DESC';
    } else if (sort === 'rating') {
      query += ' ORDER BY rating DESC';
    } else {
      query += ' ORDER BY id ASC';
    }

    const books = await dbAll(query, params);
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching books', error: err.message });
  }
});

// Grouped sections for wireframe Home View
app.get('/api/books/grouped', async (req, res) => {
  try {
    const recommended = await dbAll("SELECT * FROM books WHERE section = 'recommended' OR id IN (1,2,3)");
    const bestsellers = await dbAll("SELECT * FROM books WHERE section = 'bestseller' OR id IN (4,5,6)");
    const newLaunches = await dbAll("SELECT * FROM books WHERE section = 'new_launch' OR id IN (7,8,9)");
    
    res.json({
      recommended,
      bestsellers,
      newLaunches
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching grouped books' });
  }
});

// Categories list for sidebar
app.get('/api/categories', async (req, res) => {
  const categories = [
    'All',
    'Romance',
    'Mystery',
    'Science Fiction',
    'Fantasy',
    'Historical',
    'Biography',
    'Self-help',
    'Memoir',
    'Travel',
    'Cooking',
    'Children\'s',
    'Young Adult',
    'Comics & Graphic Novels',
    'Poetry',
    'Drama',
    'Science',
    'Philosophy',
    'Religion',
    'Language Learning'
  ];
  res.json(categories);
});

// Single book with related reads and reviews
app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await dbGet('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const reviews = await dbAll(
      'SELECT id, book_id, user_name, rating, comment, created_at FROM reviews WHERE book_id = ? ORDER BY created_at DESC',
      [book.id]
    );

    // Related reads recommendation (same category or top rated other books)
    const related = await dbAll(
      'SELECT * FROM books WHERE id != ? AND (category = ? OR rating >= 4.7) LIMIT 3',
      [book.id, book.category]
    );

    res.json({ ...book, reviews, related });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching book details' });
  }
});

// Reviews
app.post('/api/books/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const bookId = req.params.id;

    if (!rating) {
      return res.status(400).json({ message: 'Rating is required' });
    }

    await dbRun(
      'INSERT INTO reviews (book_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [bookId, req.user.id, req.user.name, Number(rating), comment || '']
    );

    const avgData = await dbGet('SELECT AVG(rating) as avg_rating FROM reviews WHERE book_id = ?', [bookId]);
    if (avgData && avgData.avg_rating) {
      await dbRun('UPDATE books SET rating = ? WHERE id = ?', [
        Math.round(avgData.avg_rating * 10) / 10,
        bookId
      ]);
    }

    res.status(201).json({ message: 'Review submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting review' });
  }
});

// ------------------------------------------------
// 4. WISHLIST MANAGEMENT
// ------------------------------------------------

app.get('/api/wishlist', authenticateToken, async (req, res) => {
  try {
    const items = await dbAll(
      `SELECT w.id as wishlist_id, b.* 
       FROM wishlist w 
       JOIN books b ON w.book_id = b.id 
       WHERE w.user_id = ?`,
      [req.user.id]
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Error loading wishlist' });
  }
});

app.post('/api/wishlist/:bookId', authenticateToken, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const exists = await dbGet('SELECT * FROM wishlist WHERE user_id = ? AND book_id = ?', [req.user.id, bookId]);
    if (exists) {
      await dbRun('DELETE FROM wishlist WHERE id = ?', [exists.id]);
      return res.json({ message: 'Removed from wishlist', wishlisted: false });
    } else {
      await dbRun('INSERT INTO wishlist (user_id, book_id) VALUES (?, ?)', [req.user.id, bookId]);
      return res.json({ message: 'Added to wishlist', wishlisted: true });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error updating wishlist' });
  }
});

// ------------------------------------------------
// 5. CART MANAGEMENT
// ------------------------------------------------

app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const items = await dbAll(
      `SELECT c.id as cart_item_id, c.quantity, b.* 
       FROM cart_items c 
       JOIN books b ON c.book_id = b.id 
       WHERE c.user_id = ?`,
      [req.user.id]
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cart' });
  }
});

app.post('/api/cart', authenticateToken, async (req, res) => {
  try {
    const { book_id, quantity = 1 } = req.body;
    const existing = await dbGet('SELECT * FROM cart_items WHERE user_id = ? AND book_id = ?', [req.user.id, book_id]);

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty <= 0) {
        await dbRun('DELETE FROM cart_items WHERE id = ?', [existing.id]);
      } else {
        await dbRun('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
      }
    } else {
      await dbRun('INSERT INTO cart_items (user_id, book_id, quantity) VALUES (?, ?, ?)', [req.user.id, book_id, quantity]);
    }

    res.json({ message: 'Cart updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating cart' });
  }
});

app.delete('/api/cart/:bookId', authenticateToken, async (req, res) => {
  try {
    await dbRun('DELETE FROM cart_items WHERE user_id = ? AND book_id = ?', [req.user.id, req.params.bookId]);
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing item from cart' });
  }
});

// ------------------------------------------------
// 6. ORDER CHECKOUT & MULTI-OPTION PAYMENT
// ------------------------------------------------

app.post('/api/orders/checkout', authenticateToken, async (req, res) => {
  try {
    const { items, delivery_address, payment_method = 'Credit Card', coupon_code } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart cannot be empty for checkout' });
    }

    if (!delivery_address) {
      return res.status(400).json({ message: 'Delivery address is required' });
    }

    // Subtotal calculation
    const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const tax = Math.round(subtotal * 0.12 * 100) / 100; // 12% standard GST / Tax
    let discount = 0;

    if (coupon_code && (coupon_code.toUpperCase() === 'BOOKWORM100' || coupon_code.toUpperCase() === 'SAVE100')) {
      discount = 100;
    }

    const totalAmount = Math.max(0, subtotal + tax - discount);
    const transactionId = 'TXN-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);

    // Save order
    const addressStr = typeof delivery_address === 'object' ? JSON.stringify(delivery_address) : delivery_address;
    const orderResult = await dbRun(
      `INSERT INTO orders (user_id, subtotal, tax, discount, total_amount, delivery_address, payment_method, payment_status, transaction_id, order_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, subtotal, tax, discount, totalAmount, addressStr, payment_method, 'succeeded', transactionId, 'Confirmed']
    );

    // Save order items
    for (const item of items) {
      await dbRun(
        `INSERT INTO order_items (order_id, book_id, title, author, price, quantity, cover_image, format, delivery_estimate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderResult.id, item.id || item.book_id, item.title, item.author || '', item.price, item.quantity || 1, item.cover_image, item.format || 'Paperback', item.delivery_estimate || 'Mon, 21 Jul']
      );
    }

    // Clear user cart
    await dbRun('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    res.status(201).json({
      message: 'Your purchase of the reads is successful!',
      orderId: orderResult.id,
      transactionId,
      subtotal,
      tax,
      discount,
      totalAmount,
      items
    });
  } catch (err) {
    res.status(500).json({ message: 'Checkout failed', error: err.message });
  }
});

// Get User Orders (with Buy Again capability)
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await dbAll(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    for (const order of orders) {
      order.items = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      if (order.delivery_address && order.delivery_address.startsWith('{')) {
        try {
          order.delivery_address_obj = JSON.parse(order.delivery_address);
        } catch (e) {}
      }
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving order history' });
  }
});

// Admin stats
app.get('/api/admin/stats', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const totalSales = await dbGet('SELECT SUM(total_amount) as total FROM orders');
    const totalOrders = await dbGet('SELECT COUNT(*) as count FROM orders');
    const totalUsers = await dbGet('SELECT COUNT(*) as count FROM users');
    const totalBooks = await dbGet('SELECT COUNT(*) as count FROM books');

    res.json({
      revenue: totalSales?.total || 0,
      orders: totalOrders?.count || 0,
      users: totalUsers?.count || 0,
      books: totalBooks?.count || 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Error loading admin stats' });
  }
});

app.listen(PORT, () => {
  console.log(`E-Bookstore Dark Theme Backend running on port ${PORT}`);
});
