# Book Worm — REST API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication

### POST `/api/auth/register`
Register a new customer account.

**Auth required:** No

**Request body:**
```json
{
  "name": "Daniel Reed",
  "email": "customer@example.com",
  "password": "password123"
}
```

**Success response `201`:**
```json
{
  "message": "User registered successfully",
  "token": "<jwt>",
  "user": {
    "id": 1,
    "name": "Daniel Reed",
    "email": "customer@example.com",
    "role": "customer"
  }
}
```

**Error responses:**
| Status | Reason |
|--------|--------|
| 400 | Missing fields |
| 400 | Email already registered |
| 500 | Server error |

---

### POST `/api/auth/login`
Log in with existing credentials.

**Auth required:** No

**Request body:**
```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

**Success response `200`:**
```json
{
  "message": "Login successful",
  "token": "<jwt>",
  "user": {
    "id": 1,
    "name": "Daniel Reed",
    "email": "customer@example.com",
    "role": "customer"
  }
}
```

**Error responses:**
| Status | Reason |
|--------|--------|
| 400 | Missing fields |
| 400 | Invalid credentials |
| 500 | Server error |

---

### GET `/api/auth/me`
Get the currently authenticated user's profile.

**Auth required:** Yes

**Success response `200`:**
```json
{
  "id": 1,
  "name": "Daniel Reed",
  "email": "customer@example.com",
  "role": "customer",
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

---

## 2. Addresses

### GET `/api/addresses`
Get all saved delivery addresses for the logged-in user.

**Auth required:** Yes

**Success response `200`:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "first_name": "Daniel",
    "last_name": "Reed",
    "email": "customer@example.com",
    "phone": "+91 9876543210",
    "address_line": "Flat 402, High Street Towers, Indiranagar",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pin": "560038",
    "country": "India",
    "is_default": 1
  }
]
```

---

### POST `/api/addresses`
Save a new delivery address.

**Auth required:** Yes

**Request body:**
```json
{
  "first_name": "Daniel",
  "last_name": "Reed",
  "email": "customer@example.com",
  "phone": "+91 9876543210",
  "address_line": "Flat 402, High Street Towers",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pin": "560038",
  "country": "India",
  "is_default": 1
}
```

**Success response `201`:**
```json
{ "id": 1, "message": "Address saved successfully" }
```

---

## 3. Books & Catalog

### GET `/api/books`
Get filtered and sorted list of books.

**Auth required:** No

**Query parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Full-text search on title, author, description, tags |
| `category` | string | Filter by genre (e.g. `Romance`, `Mystery`) |
| `language` | string | Filter by language (e.g. `English`) |
| `format` | string | Filter by format (e.g. `Paperback`, `eBook`) |
| `price_range` | string | `under_200`, `200_400`, or `above_400` |
| `sort` | string | `price_asc`, `price_desc`, `rating`, or `relevance` |

**Example request:**
```
GET /api/books?category=Romance&sort=rating
```

**Success response `200`:**
```json
[
  {
    "id": 5,
    "title": "Beneath the Stars",
    "author": "Jessica Martin",
    "price": 499,
    "category": "Romance",
    "format": "Hard Cover",
    "language": "English",
    "rating": 4.85,
    "sells_count": 420,
    "delivery_estimate": "Mon, 21 Jul",
    "cover_image": "https://...",
    "tags": "Fiction, Love, Drama",
    "section": "bestseller"
  }
]
```

---

### GET `/api/books/grouped`
Get books pre-grouped into Recommended, Bestsellers, and New Launches sections for the home page.

**Auth required:** No

**Success response `200`:**
```json
{
  "recommended": [ ...books ],
  "bestsellers": [ ...books ],
  "newLaunches": [ ...books ]
}
```

---

### GET `/api/categories`
Get the full list of book genre categories for the sidebar.

**Auth required:** No

**Success response `200`:**
```json
["All", "Romance", "Mystery", "Science Fiction", "Fantasy", "Self-help", ...]
```

---

### GET `/api/books/:id`
Get full details of a single book including reviews and related recommendations.

**Auth required:** No

**Success response `200`:**
```json
{
  "id": 7,
  "title": "Joy of Minimalism",
  "author": "Daniel Reed",
  "about_author": "Daniel Reed is a writer, minimalist...",
  "publisher": "ABC Publishers",
  "description": "Discover how less can truly be more...",
  "price": 149,
  "rating": 5.0,
  "sells_count": 145,
  "reviews": [
    {
      "id": 1,
      "user_name": "John Smith",
      "rating": 5,
      "comment": "Absolutely loved this book!",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "related": [ ...3 related books ]
}
```

**Error responses:**
| Status | Reason |
|--------|--------|
| 404 | Book not found |

---

### POST `/api/books/:id/reviews`
Submit a review for a book. Automatically recalculates the book's average rating.

**Auth required:** Yes

**Request body:**
```json
{
  "rating": 5,
  "comment": "One of the best books I've read this year."
}
```

**Success response `201`:**
```json
{ "message": "Review submitted successfully" }
```

---

## 4. Wishlist

### GET `/api/wishlist`
Get all wishlisted books for the logged-in user.

**Auth required:** Yes

**Success response `200`:**
```json
[
  {
    "wishlist_id": 1,
    "id": 7,
    "title": "Joy of Minimalism",
    "author": "Daniel Reed",
    "price": 149,
    ...
  }
]
```

---

### POST `/api/wishlist/:bookId`
Toggle a book in the wishlist — adds if not present, removes if already wishlisted.

**Auth required:** Yes

**Success response `200` (added):**
```json
{ "message": "Added to wishlist", "wishlisted": true }
```

**Success response `200` (removed):**
```json
{ "message": "Removed from wishlist", "wishlisted": false }
```

---

## 5. Cart

### GET `/api/cart`
Get all cart items for the logged-in user.

**Auth required:** Yes

**Success response `200`:**
```json
[
  {
    "cart_item_id": 1,
    "quantity": 2,
    "id": 7,
    "title": "Joy of Minimalism",
    "price": 149,
    ...
  }
]
```

---

### POST `/api/cart`
Add a book to cart or update quantity. Uses upsert logic — increments quantity if the book is already in the cart.

**Auth required:** Yes

**Request body:**
```json
{ "book_id": 7, "quantity": 1 }
```

**Success response `200`:**
```json
{ "message": "Cart updated successfully" }
```

---

### DELETE `/api/cart/:bookId`
Remove a specific book from the cart.

**Auth required:** Yes

**Success response `200`:**
```json
{ "message": "Item removed from cart" }
```

---

## 6. Orders & Checkout

### POST `/api/orders/checkout`
Place an order. Calculates tax (12% GST) and applies coupon discount. Saves order + order items and clears the cart.

**Auth required:** Yes

**Request body:**
```json
{
  "items": [
    {
      "id": 7,
      "title": "Joy of Minimalism",
      "author": "Daniel Reed",
      "price": 149,
      "quantity": 1,
      "cover_image": "https://...",
      "format": "Paperback",
      "delivery_estimate": "Mon, 21 Jul"
    }
  ],
  "delivery_address": {
    "first_name": "Daniel",
    "last_name": "Reed",
    "address_line": "Flat 402, High Street Towers",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pin": "560038",
    "phone": "+91 9876543210",
    "country": "India"
  },
  "payment_method": "Credit Card",
  "coupon_code": "BOOKWORM100"
}
```

**Success response `201`:**
```json
{
  "message": "Your purchase of the reads is successful!",
  "orderId": 1,
  "transactionId": "TXN-1719123456789-4521",
  "subtotal": 149,
  "tax": 17.88,
  "discount": 100,
  "totalAmount": 66.88,
  "items": [ ...ordered items ]
}
```

**Active coupon codes:**
| Code | Discount |
|------|----------|
| `BOOKWORM100` | ₹100 off |
| `SAVE100` | ₹100 off |

---

### GET `/api/orders`
Get full order history for the logged-in user, including all items in each order.

**Auth required:** Yes

**Success response `200`:**
```json
[
  {
    "id": 1,
    "subtotal": 149,
    "tax": 17.88,
    "discount": 100,
    "total_amount": 66.88,
    "payment_method": "Credit Card",
    "payment_status": "succeeded",
    "transaction_id": "TXN-1719123456789-4521",
    "order_status": "Confirmed",
    "created_at": "2025-07-10T10:00:00.000Z",
    "items": [ ...order items ]
  }
]
```

---

## 7. Admin

### GET `/api/admin/stats`
Get platform-wide statistics. Admin role required.

**Auth required:** Yes (Admin only)

**Success response `200`:**
```json
{
  "revenue": 12450.50,
  "orders": 34,
  "users": 12,
  "books": 9
}
```

**Error responses:**
| Status | Reason |
|--------|--------|
| 403 | Not an admin |

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Customer | `customer@example.com` | `password123` |
| Admin | `admin@example.com` | `admin123` |
