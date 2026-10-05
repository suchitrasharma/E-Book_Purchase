const bcrypt = require('bcryptjs');
const { dbRun, initSchema } = require('./db');

const seedData = async () => {
  console.log('Initializing schema and database tables...');
  await initSchema();

  console.log('Seeding demo users and admin...');
  const userPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // Clean existing tables
  await dbRun(`DELETE FROM reviews`);
  await dbRun(`DELETE FROM order_items`);
  await dbRun(`DELETE FROM orders`);
  await dbRun(`DELETE FROM cart_items`);
  await dbRun(`DELETE FROM wishlist`);
  await dbRun(`DELETE FROM addresses`);
  await dbRun(`DELETE FROM books`);
  await dbRun(`DELETE FROM users`);

  // Insert Users
  const userRes = await dbRun(
    `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
    ['Daniel Customer', 'customer@example.com', userPassword, 'customer']
  );

  await dbRun(
    `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
    ['Store Admin', 'admin@example.com', adminPassword, 'admin']
  );

  // Insert Default Address for customer
  await dbRun(
    `INSERT INTO addresses (user_id, first_name, last_name, email, phone, address_line, city, state, pin, country, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userRes.id,
      'Daniel',
      'Reed',
      'customer@example.com',
      '+91 9876543210',
      'Flat 402, High Street Towers, Indiranagar',
      'Bengaluru',
      'Karnataka',
      '560038',
      'India',
      1
    ]
  );

  console.log('Seeding exact wireframe book catalog (Dark Theme UI data)...');

  // Exact books from the slides
  const books = [
    // Recommended Section
    {
      title: 'The Art of Focus',
      author: 'Arjun Patel',
      about_author: 'Arjun Patel is a seasoned productivity coach and behavioural researcher helping leaders sharpen daily focus.',
      publisher: 'Insight Publishing',
      description: 'Practical guide to mastering focus & boosting productivity every day in high-distraction environments.',
      price: 399,
      cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      category: 'Self-help',
      sub_category: 'Non-fiction',
      format: 'Paperback',
      language: 'English',
      rating: 4.8,
      sells_count: 320,
      delivery_estimate: 'Mon, 21 Jul',
      tags: 'Non-fiction, Self Help',
      section: 'recommended',
      featured: 1
    },
    {
      title: 'The Art of Learning',
      author: 'Raj Patel',
      about_author: 'Raj Patel is an educator and cognitive trainer who specializes in rapid learning frameworks.',
      publisher: 'Horizon Books',
      description: 'Master the mindset and methods for effective lifelong learning and deep skill acquisition.',
      price: 259,
      cover_image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=600&q=80',
      category: 'Self-help',
      sub_category: 'Non-fiction',
      format: 'Paperback',
      language: 'English',
      rating: 4.9,
      sells_count: 215,
      delivery_estimate: 'Mon, 21 Jul',
      tags: 'Non-fiction, Self Help',
      section: 'recommended',
      featured: 1
    },
    {
      title: 'The Path to Success',
      author: 'James Wright',
      about_author: 'James Wright is an author, executive mentor, and keynote speaker on personal clarity and career growth.',
      publisher: 'Summit Media',
      description: 'A practical guide to achieving goals with clarity, relentless focus, and unbreakable confidence.',
      price: 359,
      cover_image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
      category: 'Self-help',
      sub_category: 'Non-fiction',
      format: 'Paperback',
      language: 'English',
      rating: 4.7,
      sells_count: 180,
      delivery_estimate: 'Mon, 21 Jul',
      tags: 'Non-fiction, Self Help',
      section: 'recommended',
      featured: 1
    },

    // Bestsellers this Month Section
    {
      title: 'The Midnight Hour',
      author: 'James Adams',
      about_author: 'James Adams is a bestselling thriller writer known for suspenseful urban tales and gripping mysteries.',
      publisher: 'Nocturne Press',
      description: 'Haunting tale of a man\'s journey & the shadows of a forgotten past in a city that never sleeps.',
      price: 299,
      cover_image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      category: 'Mystery',
      sub_category: 'Thriller',
      format: 'Paperback',
      language: 'English',
      rating: 4.6,
      sells_count: 540,
      delivery_estimate: 'Mon, 21 Jul',
      tags: 'Fiction, Thriller, Horror',
      section: 'bestseller',
      featured: 1
    },
    {
      title: 'Beneath the Stars',
      author: 'Jessica Martin',
      about_author: 'Jessica Martin writes poignant romantic literature exploring human connections and destiny.',
      publisher: 'Starlight Books',
      description: 'A heartwarming tale where two souls discover who they truly need across starry constellations.',
      price: 499,
      cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      category: 'Romance',
      sub_category: 'Drama',
      format: 'Hard Cover',
      language: 'English',
      rating: 4.85,
      sells_count: 420,
      delivery_estimate: 'Mon, 21 Jul',
      tags: 'Fiction, Love, Drama',
      section: 'bestseller',
      featured: 1
    },
    {
      title: 'The Final Frontier',
      author: 'Laura Mitchell',
      about_author: 'Laura Mitchell is an astrophysicist and science fiction novelist captivated by deep space mysteries.',
      publisher: 'Galaxy Publications',
      description: 'A mission to space secrets to change humanity forever, navigating cosmic dangers and unknown life.',
      price: 359,
      cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
      category: 'Science Fiction',
      sub_category: 'Sci-Fi',
      format: 'Paperback',
      language: 'English',
      rating: 4.9,
      sells_count: 380,
      delivery_estimate: 'Mon, 21 Jul',
      tags: 'Fiction, Thriller',
      section: 'bestseller',
      featured: 1
    },

    // New Launches Section
    {
      title: 'Joy of Minimalism',
      author: 'Daniel Reed',
      about_author: 'Daniel Reed is a writer, minimalist, and productivity coach based in San Francisco. With a passion for intentional living, Daniel has dedicated his career to helping individuals simplify their lives — one habit, space, and thought at a time. He is the author of The Joy of Minimalism, helping thousands embrace a minimalist lifestyle.',
      publisher: 'ABC Publishers',
      description: 'Discover how less can truly be more. In The Joy of Minimalism, Daniel Reed guides you through practical strategies to declutter your mind, space, and schedule. Whether you\'re overwhelmed, over-committed, or just over it—this book offers a calm, mindful approach to building a simpler, more fulfilling life.',
      price: 149,
      cover_image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
      category: 'Self-help',
      sub_category: 'Non-fiction',
      format: 'Paperback',
      language: 'English',
      rating: 5.0,
      sells_count: 145,
      delivery_estimate: 'Mon, 21 Jul',
      tags: 'Non-fiction, Self Help',
      section: 'new_launch',
      featured: 1
    },
    {
      title: 'The Vanishing House',
      author: 'Clara Nelson',
      about_author: 'Clara Nelson writes atmospheric psychological gothic mysteries.',
      publisher: 'Mistery Press',
      description: 'A chilling mystery unfolds within a mysterious Victorian house that appears and disappears.',
      price: 99,
      cover_image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80',
      category: 'Mystery',
      sub_category: 'Horror',
      format: 'eBook',
      language: 'English',
      rating: 4.4,
      sells_count: 195,
      delivery_estimate: 'Mon, 21 Jul',
      tags: 'Fiction, Horror',
      section: 'new_launch',
      featured: 1
    },
    {
      title: 'The Lost Kitten',
      author: 'Emily Parker',
      about_author: 'Emily Parker is an illustrator and children\'s storyteller.',
      publisher: 'Kindlewood Junior',
      description: 'A heartwarming tale of courage, friendship, and feline adventure for young readers.',
      price: 339,
      cover_image: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=600&q=80',
      category: 'Children\'s',
      sub_category: 'Fiction',
      format: 'Hardcover',
      language: 'English',
      rating: 4.75,
      sells_count: 275,
      delivery_estimate: 'Mon, 21 Jul',
      tags: 'Fiction, Children',
      section: 'new_launch',
      featured: 1
    }
  ];

  for (const b of books) {
    const res = await dbRun(
      `INSERT INTO books (title, author, about_author, publisher, description, price, cover_image, category, sub_category, format, language, rating, sells_count, delivery_estimate, tags, section, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.title,
        b.author,
        b.about_author,
        b.publisher,
        b.description,
        b.price,
        b.cover_image,
        b.category,
        b.sub_category,
        b.format,
        b.language,
        b.rating,
        b.sells_count,
        b.delivery_estimate,
        b.tags,
        b.section,
        b.featured
      ]
    );

    // Add a sample review for Joy of Minimalism
    if (b.title === 'Joy of Minimalism') {
      await dbRun(
        `INSERT INTO reviews (book_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)`,
        [
          res.id,
          userRes.id,
          'John Smith',
          5,
          'The accordion component delivers large amounts of content in a small space through progressive disclosure. The user gets key details about the underlying content and can choose to expand that content within the constraints of the accordion.'
        ]
      );
    }
  }

  console.log(`Database successfully seeded with ${books.length} slide-accurate books!`);
  console.log('Customer credentials: customer@example.com / password123');
  console.log('Admin credentials: admin@example.com / admin123');
};

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

module.exports = seedData;
