# 📚 LuminaBooks - Full-Stack E-Bookstore Application

A production-grade, full-stack E-Commerce bookstore platform built with **Node.js, Express, SQLite/PostgreSQL/MongoDB readiness, and Modern Interactive UI with Tailwind CSS**.

---

## 🌟 Key Features

1. **User Authentication & Authorization**
   - JWT-based authentication with password hashing (`bcryptjs`).
   - Role-Based Access Control (`customer` vs `admin`).
   - Persistent session storage and authorization tokens.

2. **Catalog & Search System**
   - Fast full-text search across titles, authors, and descriptions.
   - Category filtering (Computer Science, Software Engineering, AI, Psychology, Business, etc.).
   - Featured books showcase and aggregate 5-star rating computations.

3. **Product Detail & Customer Reviews**
   - Detailed format specifications (PDF, EPUB, MOBI).
   - Dynamic user reviews with ratings and verified customer feedback.

4. **Cart & Payment Simulation**
   - Persistent multi-device cart management.
   - Simulated 256-bit SSL Payment Gateway with instant confirmation and transaction reference numbers.
   - Built-in validation (e.g. simulation decline testing).

5. **Customer Digital Library & E-Book Downloads**
   - Purchased titles are instantly added to the user's permanent digital library.
   - Instant file download generator (PDF / EPUB mock reader generator).

6. **Admin Operations Dashboard**
   - Real-time revenue, total sales, user signups, and catalog analytics.
   - Complete inventory publishing form to add new books directly to the catalog.

---

## 🚀 Quickstart Guide

### 1. Install Server Dependencies
```bash
cd e-bookstore
npm install
```

### 2. Seed Database with Initial Books & Users
```bash
npm run seed
```

This generates initial sample data with:
- **Customer Account**: `customer@example.com` / `password123`
- **Admin Account**: `admin@example.com` / `admin123`
- Top technical books and classics.

### 3. Start Backend Server
```bash
npm run server
```
Server runs on `http://localhost:5000`.

### 4. Launch Frontend
Open `e-bookstore/client/index.html` in your browser, or serve it using any HTTP server:
```bash
npx serve client -p 3000
```
Or open directly: `e-bookstore/client/index.html`.

---

## 📁 Project Architecture

```
e-bookstore/
├── data/                    # SQLite database store (auto-created)
├── server/
│   └── src/
│       ├── auth.js          # JWT middleware & admin role verification
│       ├── db.js            # Database schema & async query wrapper
│       ├── seed.js          # Demo seed data (books, users, admin)
│       └── server.js        # Express REST API (Auth, Books, Cart, Orders, Admin)
├── client/
│   ├── index.html           # Main SPA HTML structure & responsive navigation
│   └── app.js               # Reactive client state, views, API integration
├── package.json
└── README.md
```
