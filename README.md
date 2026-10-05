# 📚 Book Worm — Full-Stack E-Bookstore Application

A production-grade, full-stack e-commerce bookstore platform built with **Node.js, Express, SQLite, and a modern dark-themed UI with Tailwind CSS**.

> 📄 **[API Documentation →](API.md)** | 🤖 **[IBM Bob Usage →](IBM_BOB_USAGE.md)** | 🐳 **[Docker Deployment →](#-docker-deployment)**

---

## 🌟 Key Features

1. **User Authentication & Authorization**
   - JWT-based login and registration with bcrypt password hashing.
   - Role-Based Access Control (`customer` vs `admin`).
   - Persistent session via localStorage; token sent as Bearer header on every protected request.

2. **Catalog & Search System**
   - Full-text search across title, author, description, and tags.
   - 20-genre category sidebar (Romance, Mystery, Science Fiction, Self-help, Children's, and more).
   - Multi-filter: language, format (Paperback / Hard Cover / eBook), price range, and sort order.
   - Home page grouped into **Recommended**, **Bestsellers**, and **New Launches** sections.

3. **Product Detail & Customer Reviews**
   - Full book detail page: cover, author bio, publisher, format, language, rating, delivery estimate.
   - Star-rated customer reviews stored in DB; book rating auto-recalculated on each new review.
   - Three related book recommendations alongside every detail page.

4. **Cart & Multi-Method Payment**
   - Server-persisted cart with quantity controls; guest cart stored in localStorage.
   - Coupon code support (`BOOKWORM100` / `SAVE100` for ₹100 off).
   - Payment modal with Credit Card, Debit Card, UPI, and Wallet options.
   - 12% GST calculated server-side at checkout; unique transaction ID generated per order.

5. **Wishlist**
   - Toggle endpoint — adds if not saved, removes if already wishlisted.
   - Dedicated My Wishlist page with direct Add to Cart action.

6. **Order History**
   - Full purchase history with order ID, transaction reference, tax breakdown, and item snapshots.
   - **Buy Again** button to re-add any previous order item to the cart instantly.

7. **Admin Stats API**
   - Protected endpoint returning total revenue, order count, user count, and book count.

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
├── data/                    # SQLite database store (auto-created on first run)
├── server/
│   └── src/
│       ├── auth.js          # JWT middleware & admin role verification
│       ├── db.js            # Database schema (7 tables) & async query helpers
│       ├── seed.js          # Demo seed: 9 books, 2 users, address, review
│       └── server.js        # Express REST API — 15 endpoints across 7 modules
├── client/
│   ├── index.html           # SPA shell: navbar, sidebar, modals
│   └── app.js               # State management, routing, API calls, view rendering
├── Dockerfile               # Container image for the backend API
├── docker-compose.yml       # Full stack: API + Nginx frontend
├── API.md                   # Complete REST API reference
├── IBM_BOB_USAGE.md         # IBM Bob usage documentation
├── package.json
└── README.md
```

---

## 🐳 Docker Deployment

### Option A — Docker Compose (recommended)
Runs the API on port 5000 and the frontend via Nginx on port 3000 with a single command:

```bash
docker-compose up --build
```

- Frontend → `http://localhost:3000`
- API → `http://localhost:5000/api`

### Option B — Docker only (API)
```bash
docker build -t bookworm-api .
docker run -p 5000:5000 bookworm-api
```
Then open `client/index.html` directly in your browser.

---

## 📄 Documentation

| File | Description |
|------|-------------|
| [API.md](API.md) | Full REST API reference — all 15 endpoints with request/response examples |
| [IBM_BOB_USAGE.md](IBM_BOB_USAGE.md) | How IBM Bob was used across every phase of development |
| [Dockerfile](Dockerfile) | Container definition for the Node.js backend |
| [docker-compose.yml](docker-compose.yml) | Full-stack container orchestration |
