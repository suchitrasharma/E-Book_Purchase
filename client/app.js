// Book Worm - Modern Dark Theme Frontend Application Logic

const API_BASE = 'http://localhost:5000/api';

// State
let state = {
  user: JSON.parse(localStorage.getItem('ebook_user')) || null,
  token: localStorage.getItem('ebook_token') || null,
  cart: [],
  wishlist: [],
  savedAddresses: [],
  selectedAddress: null,
  categories: [],
  selectedCategory: 'All',
  selectedLanguage: 'All',
  selectedFormat: 'All',
  selectedPriceRange: 'All',
  selectedSort: 'relevance',
  searchQuery: '',
  currentView: 'home', // 'home', 'detail', 'checkout', 'orders', 'wishlist'
  selectedBookId: null,
  isRegistering: false,
  selectedPaymentMethod: 'Credit Card',
  couponCode: '',
  discountApplied: 0,
  recentPurchasedItems: []
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  renderAuthNav();
  await loadCategories();
  if (state.token) {
    await loadSavedAddresses();
    await loadWishlist();
  }
  await loadCart();
  navigate('home');
});

// ------------------------------------------------
// API HELPERS
// ------------------------------------------------

async function fetchWithAuth(url, options = {}) {
  const headers = options.headers || {};
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  headers['Content-Type'] = 'application/json';

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  } catch (err) {
    console.error('Fetch error:', err);
    throw err;
  }
}

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    state.categories = await res.json();
    renderSidebarCategories();
  } catch (err) {
    state.categories = ['All', 'Romance', 'Mystery', 'Science Fiction', 'Fantasy', 'Self-help', 'Children\'s'];
    renderSidebarCategories();
  }
}

async function loadSavedAddresses() {
  try {
    const addrs = await fetchWithAuth(`${API_BASE}/addresses`);
    state.savedAddresses = addrs;
    if (addrs.length > 0) {
      state.selectedAddress = addrs[0];
    }
  } catch (e) {
    console.warn('Could not load addresses');
  }
}

async function loadWishlist() {
  try {
    state.wishlist = await fetchWithAuth(`${API_BASE}/wishlist`);
  } catch (e) {
    state.wishlist = [];
  }
}

async function loadCart() {
  if (!state.token) {
    state.cart = JSON.parse(localStorage.getItem('ebook_guest_cart')) || [];
    updateCartBadge();
    return;
  }
  try {
    state.cart = await fetchWithAuth(`${API_BASE}/cart`);
    updateCartBadge();
  } catch (err) {
    console.error('Failed to load user cart:', err);
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cartCountBadge');
  const count = state.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  badge.innerText = count;
  badge.classList.toggle('hidden', count === 0);
}

// ------------------------------------------------
// NAVIGATION & ROUTING
// ------------------------------------------------

function navigate(view, bookId = null) {
  state.currentView = view;
  state.selectedBookId = bookId;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Toggle sidebar visibility on catalog home vs checkout/detail
  const sidebar = document.getElementById('categorySidebar');
  if (view === 'home') {
    sidebar.classList.remove('hidden');
    sidebar.classList.add('md:block');
  } else {
    sidebar.classList.add('hidden');
    sidebar.classList.remove('md:block');
  }

  renderCurrentView();
  lucide.createIcons();
}

function renderSidebarCategories() {
  const container = document.getElementById('categoriesList');
  if (!container) return;

  container.innerHTML = state.categories.map(cat => {
    const isActive = state.selectedCategory === cat;
    return `
      <button
        onclick="setCategory('${cat}')"
        class="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
          isActive
            ? 'bg-[#23252a] text-white font-semibold'
            : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e2024]'
        }"
      >
        ${cat}
      </button>
    `;
  }).join('');
}

function setCategory(cat) {
  state.selectedCategory = cat;
  renderSidebarCategories();
  if (state.currentView !== 'home') {
    navigate('home');
  } else {
    renderHomeView();
  }
}

function renderCurrentView() {
  const container = document.getElementById('appContainer');
  if (state.currentView === 'home') {
    renderHomeView();
  } else if (state.currentView === 'detail') {
    renderDetailView(state.selectedBookId);
  } else if (state.currentView === 'checkout') {
    renderCheckoutView();
  } else if (state.currentView === 'orders') {
    renderOrdersView();
  } else if (state.currentView === 'wishlist') {
    renderWishlistView();
  }
}

// ------------------------------------------------
// 1. HOME & CATALOG VIEW (Exact match to Slide 4 & 5)
// ------------------------------------------------

async function renderHomeView() {
  const container = document.getElementById('appContainer');
  container.innerHTML = '<div class="text-center py-20 text-slate-500">Loading catalog...</div>';

  try {
    // If specific search or non-All category, fetch filtered list
    const isFiltered = state.selectedCategory !== 'All' || state.searchQuery || state.selectedLanguage !== 'All' || state.selectedFormat !== 'All' || state.selectedPriceRange !== 'All';

    let groupedData = null;
    let filteredBooks = null;

    if (!isFiltered) {
      const res = await fetch(`${API_BASE}/books/grouped`);
      groupedData = await res.json();
    } else {
      let queryUrl = `${API_BASE}/books?`;
      if (state.searchQuery) queryUrl += `search=${encodeURIComponent(state.searchQuery)}&`;
      if (state.selectedCategory !== 'All') queryUrl += `category=${encodeURIComponent(state.selectedCategory)}&`;
      if (state.selectedLanguage !== 'All') queryUrl += `language=${encodeURIComponent(state.selectedLanguage)}&`;
      if (state.selectedFormat !== 'All') queryUrl += `format=${encodeURIComponent(state.selectedFormat)}&`;
      if (state.selectedPriceRange !== 'All') queryUrl += `price_range=${encodeURIComponent(state.selectedPriceRange)}&`;
      if (state.selectedSort) queryUrl += `sort=${encodeURIComponent(state.selectedSort)}&`;

      const res = await fetch(queryUrl);
      filteredBooks = await res.json();
    }

    container.innerHTML = `
      <!-- TOP FILTERS BAR (Exact match to Slide 4 & 5) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        
        <!-- Search Input -->
        <div class="relative lg:col-span-1">
          <input
            type="text"
            id="searchInput"
            value="${state.searchQuery}"
            oninput="handleSearchInput(this.value)"
            placeholder="Search you want to read here"
            class="w-full bg-[#18191c] border border-[#2c2f36] rounded-lg pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-[#2563eb]"
          />
          <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2"></i>
        </div>

        <!-- Language Filter -->
        <div>
          <label class="block text-[10px] text-slate-400 mb-0.5">Language</label>
          <select
            onchange="handleFilterChange('selectedLanguage', this.value)"
            class="w-full bg-[#18191c] border border-[#2c2f36] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#2563eb]"
          >
            <option value="All" ${state.selectedLanguage === 'All' ? 'selected' : ''}>All</option>
            <option value="English" ${state.selectedLanguage === 'English' ? 'selected' : ''}>English</option>
            <option value="Hindi" ${state.selectedLanguage === 'Hindi' ? 'selected' : ''}>Hindi</option>
            <option value="Spanish" ${state.selectedLanguage === 'Spanish' ? 'selected' : ''}>Spanish</option>
          </select>
        </div>

        <!-- Format Filter -->
        <div>
          <label class="block text-[10px] text-slate-400 mb-0.5">Format (Paperback, ebook etc)</label>
          <select
            onchange="handleFilterChange('selectedFormat', this.value)"
            class="w-full bg-[#18191c] border border-[#2c2f36] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#2563eb]"
          >
            <option value="All" ${state.selectedFormat === 'All' ? 'selected' : ''}>All</option>
            <option value="Paperback" ${state.selectedFormat === 'Paperback' ? 'selected' : ''}>Paperback</option>
            <option value="Hard Cover" ${state.selectedFormat === 'Hard Cover' ? 'selected' : ''}>Hard Cover</option>
            <option value="eBook" ${state.selectedFormat === 'eBook' ? 'selected' : ''}>eBook</option>
          </select>
        </div>

        <!-- Price Range Filter -->
        <div>
          <label class="block text-[10px] text-slate-400 mb-0.5">Price Range</label>
          <select
            onchange="handleFilterChange('selectedPriceRange', this.value)"
            class="w-full bg-[#18191c] border border-[#2c2f36] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#2563eb]"
          >
            <option value="All" ${state.selectedPriceRange === 'All' ? 'selected' : ''}>All</option>
            <option value="under_200" ${state.selectedPriceRange === 'under_200' ? 'selected' : ''}>Under ₹200</option>
            <option value="200_400" ${state.selectedPriceRange === '200_400' ? 'selected' : ''}>₹200 - ₹400</option>
            <option value="above_400" ${state.selectedPriceRange === 'above_400' ? 'selected' : ''}>Above ₹400</option>
          </select>
        </div>

        <!-- Sort Filter -->
        <div>
          <label class="block text-[10px] text-slate-400 mb-0.5">Sort by</label>
          <select
            onchange="handleFilterChange('selectedSort', this.value)"
            class="w-full bg-[#18191c] border border-[#2c2f36] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#2563eb]"
          >
            <option value="relevance" ${state.selectedSort === 'relevance' ? 'selected' : ''}>Relevance</option>
            <option value="price_asc" ${state.selectedSort === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
            <option value="price_desc" ${state.selectedSort === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
            <option value="rating" ${state.selectedSort === 'rating' ? 'selected' : ''}>Customer Rating</option>
          </select>
        </div>
      </div>

      <!-- MAIN CATALOG LISTINGS -->
      ${!isFiltered ? `
        <!-- Recommended for You Section -->
        <div class="mb-10">
          <h2 class="text-sm font-semibold text-white mb-4">Recommended for You</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${groupedData.recommended.map(b => renderHorizontalBookCard(b)).join('')}
          </div>
        </div>

        <!-- Bestsellers this Month Section -->
        <div class="mb-10">
          <h2 class="text-sm font-semibold text-white mb-4">Bestsellers this Month</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${groupedData.bestsellers.map(b => renderHorizontalBookCard(b)).join('')}
          </div>
        </div>

        <!-- New Launches Section -->
        <div class="mb-10">
          <h2 class="text-sm font-semibold text-white mb-4">New Launches</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${groupedData.newLaunches.map(b => renderHorizontalBookCard(b)).join('')}
          </div>
        </div>
      ` : `
        <!-- Filtered Results -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-white">
              Showing results for: <span class="text-[#2563eb]">${state.selectedCategory}</span> 
              <span class="text-slate-400 text-xs font-normal">(${filteredBooks.length} items)</span>
            </h2>
          </div>
          ${filteredBooks.length === 0 ? `
            <div class="text-center py-16 bg-[#18191c] rounded-2xl border border-[#2c2f36]">
              <i data-lucide="book-x" class="w-10 h-10 text-slate-500 mx-auto mb-2"></i>
              <p class="text-sm text-slate-400">No books found matching your active filters.</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${filteredBooks.map(b => renderHorizontalBookCard(b)).join('')}
            </div>
          `}
        </div>
      `}
    `;
    lucide.createIcons();
  } catch (err) {
    container.innerHTML = '<div class="text-red-400 py-10">Error loading catalog</div>';
  }
}

// Card matching Wireframe layout: Cover on left, Info & Tags & Price on right
function renderHorizontalBookCard(book) {
  const isWishlisted = state.wishlist.some(w => (w.id || w.book_id) === book.id);

  return `
    <div class="bg-[#18191c] border border-[#2c2f36] rounded-xl p-3.5 flex gap-4 hover:border-slate-600 transition-all group">
      <!-- Cover Thumbnail -->
      <div class="w-28 shrink-0 aspect-[3/4] rounded-lg overflow-hidden bg-[#23252a] cursor-pointer" onclick="navigate('detail', ${book.id})">
        <img
          src="${book.cover_image}"
          alt="${book.title}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
      </div>

      <!-- Info Column -->
      <div class="flex-1 flex flex-col justify-between text-xs">
        <div>
          <h3 onclick="navigate('detail', ${book.id})" class="text-white font-bold text-sm cursor-pointer hover:text-[#2563eb] line-clamp-1">
            ${book.title}
          </h3>
          <p class="text-[11px] text-slate-400 mt-0.5">by <span class="text-[#2563eb]">${book.author}</span></p>
          <p class="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            ${book.description}
          </p>

          <span class="block text-[10px] text-slate-400 mt-2">${book.format || 'Paperback'}</span>

          <!-- Tags -->
          <div class="flex flex-wrap gap-1 mt-1.5">
            ${(book.tags || 'Non-fiction, Self Help').split(',').map(tag => `
              <span class="text-[9px] text-[#2563eb] bg-[#2563eb]/10 px-1.5 py-0.5 rounded">
                ${tag.trim()}
              </span>
            `).join('')}
          </div>
        </div>

        <div class="pt-3 flex items-center justify-between border-t border-[#2c2f36]/60 mt-2">
          <div>
            <div class="text-white font-extrabold text-sm">₹${Number(book.price).toFixed(0)}</div>
            <div class="text-[10px] text-slate-400">Delivery by <span class="font-semibold text-slate-300">${book.delivery_estimate || 'Mon, 21 Jul'}</span></div>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              onclick="toggleWishlist(${book.id})"
              title="Add to Wishlist"
              class="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-[#23252a] transition-colors"
            >
              <i data-lucide="bookmark" class="w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}"></i>
            </button>
            <button
              onclick="addToCart(${book.id})"
              class="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
            >
              <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ------------------------------------------------
// 2. PRODUCT DETAIL VIEW (Exact match to Slide 6)
// ------------------------------------------------

async function renderDetailView(bookId) {
  const container = document.getElementById('appContainer');
  container.innerHTML = '<div class="text-center py-20 text-slate-500">Loading book details...</div>';

  try {
    const res = await fetch(`${API_BASE}/books/${bookId}`);
    const book = await res.json();
    const isWishlisted = state.wishlist.some(w => (w.id || w.book_id) === book.id);

    container.innerHTML = `
      <!-- Breadcrumb: Home / Category / Sub-Category / Title -->
      <nav class="text-xs text-slate-400 flex items-center gap-2 mb-6">
        <button onclick="navigate('home')" class="hover:text-white">Home</button>
        <span>/</span>
        <button onclick="setCategory('${book.category}')" class="hover:text-white">${book.category}</button>
        <span>/</span>
        <span class="text-slate-300">${book.sub_category || 'Self Help'}</span>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left 2 Cols: Main Book Detail & Reviews -->
        <div class="lg:col-span-2 space-y-8">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#18191c] border border-[#2c2f36] rounded-2xl p-6">
            <!-- Cover image -->
            <div class="aspect-[3/4] rounded-xl overflow-hidden bg-[#23252a] shadow-lg">
              <img src="${book.cover_image}" alt="${book.title}" class="w-full h-full object-cover">
            </div>

            <!-- Details -->
            <div class="flex flex-col justify-between space-y-4">
              <div>
                <h1 class="text-xl font-extrabold text-white">${book.title}</h1>
                <p class="text-xs text-slate-400 mt-1">by <span class="text-[#2563eb] font-semibold">${book.author}</span></p>
                <p class="text-[11px] text-slate-400 italic mt-2">"A refreshing path to clarity in a cluttered world."</p>

                <p class="text-[11px] text-slate-400 mt-2">Published by: <span class="text-slate-300 font-semibold">${book.publisher || 'ABC Publishers'}</span></p>

                <div class="mt-3">
                  <span class="text-[11px] text-slate-400 block mb-1">${book.format || 'Paperback'}</span>
                  <div class="flex gap-1.5">
                    ${(book.tags || 'Non-fiction, Self Help').split(',').map(tag => `
                      <span class="text-[10px] text-[#2563eb] bg-[#2563eb]/10 px-2 py-0.5 rounded font-medium">
                        ${tag.trim()}
                      </span>
                    `).join('')}
                  </div>
                </div>

                <div class="mt-5">
                  <div class="text-2xl font-black text-white">₹${Number(book.price).toFixed(0)}</div>
                  <div class="text-xs text-slate-400 mt-0.5">Delivery by <span class="font-semibold text-slate-300">${book.delivery_estimate || 'Mon, 21 Jul'}</span></div>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="space-y-4 pt-2">
                <div class="flex gap-3">
                  <button
                    onclick="addToCart(${book.id})"
                    class="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow"
                  >
                    <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                    <span>Add to Cart</span>
                  </button>

                  <button
                    onclick="toggleWishlist(${book.id})"
                    class="flex-1 bg-[#23252a] hover:bg-[#2c2f36] text-slate-200 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-[#2c2f36]"
                  >
                    <i data-lucide="bookmark" class="w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}"></i>
                    <span>${isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
                  </button>
                </div>

                <!-- Specs row: Language, Rating, Sells -->
                <div class="grid grid-cols-3 gap-2 border-t border-[#2c2f36] pt-4 text-center">
                  <div>
                    <span class="block text-[10px] text-slate-400">Language</span>
                    <span class="text-xs font-semibold text-[#2563eb]">${book.language || 'English'}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] text-slate-400">Rating</span>
                    <div class="text-xs font-semibold text-amber-400 flex items-center justify-center gap-1">
                      <span>★</span> ${book.rating || '5.0'}
                    </div>
                  </div>
                  <div>
                    <span class="block text-[10px] text-slate-400">Sells</span>
                    <span class="text-xs font-semibold text-slate-300">${book.sells_count || 145} copies sold</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- About the Writer Section -->
          <div class="bg-[#18191c] border border-[#2c2f36] rounded-2xl p-6">
            <h3 class="text-sm font-bold text-white mb-4">About the writer</h3>
            <div class="flex gap-4 items-start">
              <div class="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-[#23252a] border border-[#2c2f36]">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" class="w-full h-full object-cover">
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">${book.author}</h4>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed">
                  ${book.about_author || 'Daniel Reed is a writer, minimalist, and productivity coach based in San Francisco. With a passion for intentional living, Daniel has dedicated his career to helping individuals simplify their lives.'}
                </p>
              </div>
            </div>
          </div>

          <!-- Reviews Section -->
          <div class="bg-[#18191c] border border-[#2c2f36] rounded-2xl p-6 space-y-4">
            <h3 class="text-sm font-bold text-white">Reviews</h3>
            
            <!-- Submit Review Form -->
            <form onsubmit="handleReviewSubmit(event, ${book.id})" class="space-y-3">
              <label class="block text-xs text-slate-400">Leave Your Review</label>
              <textarea
                id="reviewText"
                rows="3"
                maxlength="100"
                placeholder="Placeholder text"
                class="w-full bg-[#141518] border border-[#2c2f36] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#2563eb]"
              ></textarea>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1 text-amber-400 text-sm">
                  <span>★★★★★</span>
                </div>
                <button type="submit" class="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold px-5 py-2 rounded-lg flex items-center gap-1">
                  <span>Submit</span>
                  <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </form>

            <!-- Existing reviews -->
            <div class="pt-4 border-t border-[#2c2f36] space-y-3">
              ${(book.reviews && book.reviews.length > 0) ? book.reviews.map(r => `
                <div class="bg-[#141518] p-4 rounded-xl border border-[#2c2f36]">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-white">${r.user_name}</span>
                    <span class="text-amber-400 text-xs">★★★★★</span>
                  </div>
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">${r.comment}</p>
                </div>
              `).join('') : '<p class="text-xs text-slate-500">No customer reviews yet.</p>'}
            </div>
          </div>
        </div>

        <!-- Right Col: Related Reads (Slide 6 sidebar) -->
        <div class="space-y-4">
          <h3 class="text-sm font-bold text-white">Related Reads</h3>
          <div class="space-y-4">
            ${(book.related || []).map(r => `
              <div class="bg-[#18191c] border border-[#2c2f36] rounded-xl p-3 flex gap-3 hover:border-slate-600 transition-all cursor-pointer" onclick="navigate('detail', ${r.id})">
                <div class="w-20 shrink-0 aspect-[3/4] rounded-lg overflow-hidden bg-[#23252a]">
                  <img src="${r.cover_image}" alt="${r.title}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 flex flex-col justify-between text-xs">
                  <div>
                    <h4 class="font-bold text-white line-clamp-1">${r.title}</h4>
                    <p class="text-[11px] text-slate-400">by <span class="text-[#2563eb]">${r.author}</span></p>
                    <span class="block text-[10px] text-slate-400 mt-1">${r.format || 'Paperback'}</span>
                    <div class="flex gap-1 mt-1">
                      <span class="text-[9px] text-[#2563eb] bg-[#2563eb]/10 px-1 rounded">${r.category}</span>
                    </div>
                  </div>
                  <div class="mt-2">
                    <div class="text-white font-bold text-xs">₹${Number(r.price).toFixed(0)}</div>
                    <div class="text-[10px] text-slate-400">Delivery by <span class="text-slate-300 font-semibold">${r.delivery_estimate || 'Mon, 21 Jul'}</span></div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;
    lucide.createIcons();
  } catch (err) {
    container.innerHTML = '<div class="text-red-400 py-10">Error loading book details</div>';
  }
}

// ------------------------------------------------
// 3. PAYMENT & CHECKOUT SCREEN (Exact match to Slide 7)
// ------------------------------------------------

function renderCheckoutView() {
  const container = document.getElementById('appContainer');
  const items = state.cart;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="max-w-xl mx-auto text-center py-20 bg-[#18191c] rounded-2xl border border-[#2c2f36]">
        <i data-lucide="shopping-bag" class="w-12 h-12 text-slate-500 mx-auto mb-3"></i>
        <h2 class="text-lg font-bold text-white">Your Shopping Cart is empty</h2>
        <p class="text-xs text-slate-400 mt-1 mb-6">Explore our catalog and pick books to checkout.</p>
        <button onclick="navigate('home')" class="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold px-6 py-2.5 rounded-xl">
          Browse Catalog
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const tax = Math.round(subtotal * 0.12);
  const total = Math.max(0, subtotal + tax - state.discountApplied);

  const defaultAddr = state.selectedAddress || {
    first_name: 'Daniel',
    last_name: 'Reed',
    address_line: 'Address Line 2',
    email: 'customer@example.com',
    city: 'City',
    pin: '000000',
    phone: '12345567890',
    state: 'State',
    country: 'India'
  };

  container.innerHTML = `
    <!-- Breadcrumb: Home / Non-Fiction / Self Help / Title / Checkout -->
    <nav class="text-xs text-slate-400 flex items-center gap-2 mb-6">
      <button onclick="navigate('home')" class="hover:text-white">Home</button>
      <span>/</span>
      <span class="text-slate-400">Non-Fiction</span>
      <span>/</span>
      <span class="text-slate-400">Self Help</span>
      <span>/</span>
      <span class="text-slate-200">Checkout</span>
    </nav>

    <div class="space-y-6">
      <h2 class="text-base font-bold text-white">Shopping Cart</h2>

      <!-- Top Row: Cart Items Cards (matching Slide 7) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${items.map(item => `
          <div class="bg-[#18191c] border border-[#2c2f36] rounded-xl p-4 flex gap-4">
            <div class="w-24 shrink-0 aspect-[3/4] rounded-lg overflow-hidden bg-[#23252a]">
              <img src="${item.cover_image}" alt="${item.title}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 flex flex-col justify-between text-xs">
              <div>
                <h4 class="font-bold text-white text-sm line-clamp-1">${item.title}</h4>
                <p class="text-[11px] text-slate-400">by <span class="text-[#2563eb]">${item.author}</span></p>
                <span class="block text-[10px] text-slate-400 mt-1">${item.format || 'Paperback'}</span>
                <span class="text-[9px] text-[#2563eb] bg-[#2563eb]/10 px-1.5 py-0.5 rounded inline-block mt-1">${item.category || 'Self Help'}</span>
                
                <div class="mt-2 text-white font-bold text-sm">₹${Number(item.price).toFixed(0)}</div>
                <div class="text-[10px] text-slate-400">Delivery by <span class="font-semibold text-slate-300">${item.delivery_estimate || 'Mon, 21 Jul'}</span></div>
              </div>

              <!-- Quantity Controls -->
              <div class="flex items-center gap-3 pt-2">
                <div class="flex items-center border border-[#2c2f36] rounded-lg bg-[#141518]">
                  <button onclick="changeQuantity(${item.id || item.book_id}, -1)" class="px-2 py-1 text-slate-400 hover:text-white">-</button>
                  <span class="px-2 text-xs font-semibold text-white">${item.quantity || 1}</span>
                  <button onclick="changeQuantity(${item.id || item.book_id}, 1)" class="px-2 py-1 text-slate-400 hover:text-white">+</button>
                </div>
                <button onclick="removeFromCart(${item.id || item.book_id})" class="text-xs text-red-400 hover:underline">Remove</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Bottom Grid: Delivery Address Form (Left) & Grand Total (Right) (Exact match to Slide 7) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        <!-- Left 2 Cols: Delivery Address Form -->
        <div class="lg:col-span-2 bg-[#18191c] border border-[#2c2f36] rounded-2xl p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white">Address</h3>
            <label class="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" id="useSavedAddress" checked onchange="toggleSavedAddress(this.checked)" class="rounded bg-[#141518] border-[#2c2f36] text-[#2563eb]">
              <span>Use Saved Address</span>
            </label>
          </div>

          <form id="addressForm" class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="block text-[10px] text-slate-400 mb-1">First Name</label>
                <input type="text" id="addrFirstName" value="${defaultAddr.first_name || ''}" placeholder="First Name" class="w-full bg-[#141518] border border-[#2c2f36] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2563eb]">
              </div>
              <div>
                <label class="block text-[10px] text-slate-400 mb-1">Last Name</label>
                <input type="text" id="addrLastName" value="${defaultAddr.last_name || ''}" placeholder="Last Name" class="w-full bg-[#141518] border border-[#2c2f36] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2563eb]">
              </div>
              <div>
                <label class="block text-[10px] text-slate-400 mb-1">Address</label>
                <input type="text" id="addrLine" value="${defaultAddr.address_line || ''}" placeholder="Address Line 2" class="w-full bg-[#141518] border border-[#2c2f36] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2563eb]">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="block text-[10px] text-slate-400 mb-1">e-mail</label>
                <input type="email" id="addrEmail" value="${defaultAddr.email || state.user?.email || 'customer@example.com'}" placeholder="e-mail" class="w-full bg-[#141518] border border-[#2c2f36] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2563eb]">
              </div>
              <div>
                <label class="block text-[10px] text-slate-400 mb-1">City</label>
                <input type="text" id="addrCity" value="${defaultAddr.city || ''}" placeholder="City" class="w-full bg-[#141518] border border-[#2c2f36] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2563eb]">
              </div>
              <div>
                <label class="block text-[10px] text-slate-400 mb-1">Pin</label>
                <input type="text" id="addrPin" value="${defaultAddr.pin || ''}" placeholder="000000" class="w-full bg-[#141518] border border-[#2c2f36] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2563eb]">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="block text-[10px] text-slate-400 mb-1">Phone Number</label>
                <div class="flex gap-2">
                  <select class="bg-[#141518] border border-[#2c2f36] rounded-lg px-2 text-xs text-slate-300">
                    <option>+91</option>
                    <option>+1</option>
                  </select>
                  <input type="text" id="addrPhone" value="${defaultAddr.phone || ''}" placeholder="12345567890" class="flex-1 bg-[#141518] border border-[#2c2f36] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2563eb]">
                </div>
              </div>
              <div>
                <label class="block text-[10px] text-slate-400 mb-1">State</label>
                <input type="text" id="addrState" value="${defaultAddr.state || ''}" placeholder="State" class="w-full bg-[#141518] border border-[#2c2f36] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2563eb]">
              </div>
              <div>
                <label class="block text-[10px] text-slate-400 mb-1">Country</label>
                <select id="addrCountry" class="w-full bg-[#141518] border border-[#2c2f36] rounded-lg px-3 py-2 text-xs text-slate-300">
                  <option value="India">India</option>
                  <option value="USA">United States</option>
                  <option value="UK">United Kingdom</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <!-- Right Col: Grand Total, Coupon, and Pay Now Button -->
        <div class="bg-[#18191c] border border-[#2c2f36] rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-white">Grand Total</h3>

            <div class="space-y-2 text-xs text-slate-400">
              <div class="flex justify-between">
                <span>Price (${items.length} items)</span>
                <span class="text-white font-medium">₹${subtotal.toFixed(2)}</span>
              </div>
              <div class="flex justify-between">
                <span>Tax</span>
                <span class="text-white font-medium">₹${tax.toFixed(2)}</span>
              </div>
              <div class="flex justify-between">
                <span>Delivery Charges</span>
                <span class="text-[#16a34a] font-medium">Free</span>
              </div>

              <!-- Coupon Code Input -->
              <div class="pt-2">
                <div class="flex gap-2">
                  <input
                    type="text"
                    id="couponInput"
                    placeholder="Apply Coupon (e.g. BOOKWORM100)"
                    value="${state.couponCode}"
                    class="flex-1 bg-[#141518] border border-[#2c2f36] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#2563eb]"
                  />
                  <button
                    onclick="applyCoupon()"
                    class="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div class="flex justify-between text-xs pt-2">
                <span>Discount</span>
                <span class="text-white font-medium">₹${state.discountApplied.toFixed(0)}</span>
              </div>
            </div>
          </div>

          <div class="border-t border-[#2c2f36] pt-4 space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-sm font-bold text-white">Total Amount</span>
              <span class="text-base font-extrabold text-white">₹${total.toFixed(0)}</span>
            </div>

            <button
              onclick="openPaymentModal(${total})"
              class="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <span>Pay Now</span>
              <i data-lucide="credit-card" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

      </div>
    </div>
  `;
  lucide.createIcons();
}

function applyCoupon() {
  const code = document.getElementById('couponInput')?.value.trim();
  if (code.toUpperCase() === 'BOOKWORM100' || code.toUpperCase() === 'SAVE100') {
    state.couponCode = code;
    state.discountApplied = 100;
    showToast('Coupon applied: ₹100 Discount!');
    renderCheckoutView();
  } else {
    alert('Invalid coupon code. Try BOOKWORM100 for ₹100 off.');
  }
}

// ------------------------------------------------
// 4. COMPLETE PAYMENT MODAL & EXECUTION (Slide 8 & 9)
// ------------------------------------------------

let payableTotal = 0;

function openPaymentModal(total) {
  if (!state.token) {
    openAuthModal();
    return;
  }
  payableTotal = total;
  document.getElementById('paymentModalAmount').innerText = `₹${total.toFixed(0)}`;
  document.getElementById('paymentModal').classList.remove('hidden');
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.add('hidden');
}

function switchPaymentMethod(method) {
  state.selectedPaymentMethod = method;
  
  // Highlight active tab
  ['CreditCard', 'DebitCard', 'UPI', 'Wallet'].forEach(m => {
    const el = document.getElementById(`pmTab-${m}`);
    if (el) {
      if ((m === 'CreditCard' && method === 'Credit Card') ||
          (m === 'DebitCard' && method === 'Debit Card') ||
          (m === 'UPI' && method === 'UPI') ||
          (m === 'Wallet' && method === 'Wallet')) {
        el.className = 'w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold bg-[#2563eb] text-white';
      } else {
        el.className = 'w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:bg-[#282a30]';
      }
    }
  });

  // Switch input visibility
  document.getElementById('cardFields').classList.toggle('hidden', !(method === 'Credit Card' || method === 'Debit Card'));
  document.getElementById('upiFields').classList.toggle('hidden', method !== 'UPI');
  document.getElementById('walletFields').classList.toggle('hidden', method !== 'Wallet');
}

async function executePayment() {
  const btn = document.getElementById('confirmPayBtn');
  btn.disabled = true;
  btn.innerText = 'Processing...';

  // Gather delivery address
  const deliveryAddress = {
    first_name: document.getElementById('addrFirstName')?.value || 'Daniel',
    last_name: document.getElementById('addrLastName')?.value || 'Reed',
    address_line: document.getElementById('addrLine')?.value || 'Address Line 2',
    email: document.getElementById('addrEmail')?.value || 'customer@example.com',
    city: document.getElementById('addrCity')?.value || 'City',
    pin: document.getElementById('addrPin')?.value || '000000',
    phone: document.getElementById('addrPhone')?.value || '12345567890',
    state: document.getElementById('addrState')?.value || 'State',
    country: document.getElementById('addrCountry')?.value || 'India'
  };

  try {
    const res = await fetchWithAuth(`${API_BASE}/orders/checkout`, {
      method: 'POST',
      body: JSON.stringify({
        items: state.cart,
        delivery_address: deliveryAddress,
        payment_method: state.selectedPaymentMethod,
        coupon_code: state.couponCode
      })
    });

    state.recentPurchasedItems = [...state.cart];
    state.cart = [];
    localStorage.removeItem('ebook_guest_cart');
    updateCartBadge();

    closePaymentModal();
    openSuccessModal();
  } catch (err) {
    alert(err.message || 'Payment simulation failed');
    btn.disabled = false;
    btn.innerText = 'Pay Now';
  }
}

function openSuccessModal() {
  const preview = document.getElementById('purchasedBooksPreview');
  const items = state.recentPurchasedItems;

  preview.innerHTML = items.slice(0, 2).map(item => `
    <div class="bg-[#141518] border border-[#2c2f36] rounded-xl p-3 flex gap-3">
      <div class="w-16 shrink-0 aspect-[3/4] rounded-lg overflow-hidden bg-[#23252a]">
        <img src="${item.cover_image}" alt="${item.title}" class="w-full h-full object-cover">
      </div>
      <div class="text-xs">
        <h4 class="font-bold text-white line-clamp-1">${item.title}</h4>
        <p class="text-[10px] text-slate-400">by <span class="text-[#2563eb]">${item.author}</span></p>
        <span class="block text-[9px] text-slate-400 mt-1">${item.format || 'Paperback'}</span>
        <span class="text-[9px] text-[#2563eb] bg-[#2563eb]/10 px-1 rounded inline-block mt-1">${item.category || 'Self Help'}</span>
        <div class="mt-1 text-white font-bold">₹${Number(item.price).toFixed(0)}</div>
        <div class="text-[9px] text-slate-400">Delivery by ${item.delivery_estimate || 'Mon, 21 Jul'}</div>
      </div>
    </div>
  `).join('');

  document.getElementById('successModal').classList.remove('hidden');
  lucide.createIcons();
}

function closeSuccessModalAndRedirect() {
  document.getElementById('successModal').classList.add('hidden');
  navigate('orders');
}

// ------------------------------------------------
// 5. ORDERS & BUY IN AGAIN VIEW
// ------------------------------------------------

async function renderOrdersView() {
  const container = document.getElementById('appContainer');
  if (!state.token) {
    openAuthModal();
    return;
  }

  container.innerHTML = '<div class="text-center py-20 text-slate-500">Loading your orders...</div>';

  try {
    const orders = await fetchWithAuth(`${API_BASE}/orders`);

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="max-w-xl mx-auto text-center py-20 bg-[#18191c] rounded-2xl border border-[#2c2f36]">
          <i data-lucide="shopping-bag" class="w-12 h-12 text-slate-500 mx-auto mb-3"></i>
          <h2 class="text-lg font-bold text-white">No Previous Orders</h2>
          <p class="text-xs text-slate-400 mt-1 mb-6">You haven't placed any orders yet.</p>
          <button onclick="navigate('home')" class="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold px-6 py-2.5 rounded-xl">
            Explore Books
          </button>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="space-y-6">
        <div>
          <h1 class="text-lg font-bold text-white">Order History</h1>
          <p class="text-xs text-slate-400 mt-0.5">Browse past orders and easily reorder with the "Buy In Again" feature.</p>
        </div>

        <div class="space-y-4">
          ${orders.map(order => `
            <div class="bg-[#18191c] border border-[#2c2f36] rounded-2xl overflow-hidden">
              <div class="bg-[#141518] px-6 py-3 border-b border-[#2c2f36] flex flex-wrap items-center justify-between text-xs text-slate-400">
                <div class="flex gap-6">
                  <div>
                    <span class="block text-[10px] text-slate-500">Order Placed</span>
                    <span class="font-bold text-slate-200">${new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] text-slate-500">Total</span>
                    <span class="font-bold text-slate-200">₹${Number(order.total_amount).toFixed(0)}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] text-slate-500">Payment</span>
                    <span class="font-bold text-slate-200">${order.payment_method || 'Card'} (${order.payment_status})</span>
                  </div>
                </div>
                <span class="bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                  ${order.order_status || 'Delivered'}
                </span>
              </div>

              <div class="p-6 divide-y divide-[#2c2f36]">
                ${order.items.map(item => `
                  <div class="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                      <div class="w-14 h-20 bg-[#23252a] rounded-lg overflow-hidden shrink-0">
                        <img src="${item.cover_image}" alt="${item.title}" class="w-full h-full object-cover">
                      </div>
                      <div>
                        <h4 class="font-bold text-white text-xs">${item.title}</h4>
                        <p class="text-[11px] text-slate-400">by ${item.author || ''}</p>
                        <span class="text-xs text-slate-300 font-bold mt-1 block">₹${Number(item.price).toFixed(0)} • Qty: ${item.quantity || 1}</span>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <button
                        onclick="addToCart(${item.book_id || item.id})"
                        class="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow"
                      >
                        <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                        <span>Buy In Again</span>
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (err) {
    container.innerHTML = '<div class="text-red-400 py-10">Error loading orders</div>';
  }
}

// ------------------------------------------------
// 6. WISHLIST VIEW
// ------------------------------------------------

async function renderWishlistView() {
  const container = document.getElementById('appContainer');
  if (!state.token) {
    openAuthModal();
    return;
  }

  container.innerHTML = '<div class="text-center py-20 text-slate-500">Loading your wishlist...</div>';
  await loadWishlist();

  if (state.wishlist.length === 0) {
    container.innerHTML = `
      <div class="max-w-xl mx-auto text-center py-20 bg-[#18191c] rounded-2xl border border-[#2c2f36]">
        <i data-lucide="bookmark" class="w-12 h-12 text-slate-500 mx-auto mb-3"></i>
        <h2 class="text-lg font-bold text-white">Your Wishlist is Empty</h2>
        <p class="text-xs text-slate-400 mt-1 mb-6">Save titles you are interested in reading later.</p>
        <button onclick="navigate('home')" class="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold px-6 py-2.5 rounded-xl">
          Browse Catalog
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div class="space-y-6">
      <div>
        <h1 class="text-lg font-bold text-white">My Wishlist</h1>
        <p class="text-xs text-slate-400 mt-0.5">Your saved reads ready to be added to cart.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${state.wishlist.map(b => renderHorizontalBookCard(b)).join('')}
      </div>
    </div>
  `;
  lucide.createIcons();
}

// ------------------------------------------------
// ACTIONS & CART HELPERS
// ------------------------------------------------

async function addToCart(bookId) {
  if (state.token) {
    try {
      await fetchWithAuth(`${API_BASE}/cart`, {
        method: 'POST',
        body: JSON.stringify({ book_id: bookId, quantity: 1 })
      });
      await loadCart();
      showToast('Book added to your cart!');
    } catch (e) {
      alert(e.message);
    }
  } else {
    // Guest cart fallback
    const res = await fetch(`${API_BASE}/books/${bookId}`);
    const book = await res.json();
    const existing = state.cart.find(i => (i.id || i.book_id) === bookId);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      state.cart.push({ ...book, quantity: 1 });
    }
    localStorage.setItem('ebook_guest_cart', JSON.stringify(state.cart));
    updateCartBadge();
    showToast('Book added to your cart!');
  }
}

async function changeQuantity(bookId, delta) {
  if (state.token) {
    await fetchWithAuth(`${API_BASE}/cart`, {
      method: 'POST',
      body: JSON.stringify({ book_id: bookId, quantity: delta })
    });
    await loadCart();
  } else {
    const item = state.cart.find(i => (i.id || i.book_id) === bookId);
    if (item) {
      item.quantity = (item.quantity || 1) + delta;
      if (item.quantity <= 0) {
        state.cart = state.cart.filter(i => (i.id || i.book_id) !== bookId);
      }
      localStorage.setItem('ebook_guest_cart', JSON.stringify(state.cart));
      updateCartBadge();
    }
  }
  renderCheckoutView();
}

async function removeFromCart(bookId) {
  if (state.token) {
    await fetchWithAuth(`${API_BASE}/cart/${bookId}`, { method: 'DELETE' });
    await loadCart();
  } else {
    state.cart = state.cart.filter(i => (i.id || i.book_id) !== bookId);
    localStorage.setItem('ebook_guest_cart', JSON.stringify(state.cart));
    updateCartBadge();
  }
  renderCheckoutView();
}

async function toggleWishlist(bookId) {
  if (!state.token) {
    openAuthModal();
    return;
  }
  try {
    const res = await fetchWithAuth(`${API_BASE}/wishlist/${bookId}`, { method: 'POST' });
    await loadWishlist();
    showToast(res.message);
    if (state.currentView === 'wishlist') renderWishlistView();
    else if (state.currentView === 'home') renderHomeView();
    else if (state.currentView === 'detail') renderDetailView(bookId);
  } catch (e) {
    alert(e.message);
  }
}

// ------------------------------------------------
// AUTHENTICATION & MODAL LOGIC
// ------------------------------------------------

function renderAuthNav() {
  const container = document.getElementById('authActions');
  if (state.user) {
    container.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-full bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center">
          ${state.user.name.charAt(0)}
        </div>
        <button onclick="handleLogout()" class="text-xs text-slate-400 hover:text-red-400">
          Logout
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button onclick="openAuthModal(false)" class="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg">
        Sign In
      </button>
    `;
  }
}

function openAuthModal(isReg = false) {
  state.isRegistering = isReg;
  document.getElementById('authModalTitle').innerText = isReg ? 'Create Account' : 'Sign In to Book Worm';
  document.getElementById('authNameField').classList.toggle('hidden', !isReg);
  document.getElementById('authSubmitBtnText').innerText = isReg ? 'Create Account' : 'Sign In';
  document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}

function toggleAuthMode() {
  openAuthModal(!state.isRegistering);
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName')?.value;

  const endpoint = state.isRegistering ? '/auth/register' : '/auth/login';
  const body = state.isRegistering ? { name, email, password } : { email, password };

  try {
    const data = await fetchWithAuth(`${API_BASE}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    state.user = data.user;
    state.token = data.token;
    localStorage.setItem('ebook_user', JSON.stringify(data.user));
    localStorage.setItem('ebook_token', data.token);

    closeAuthModal();
    renderAuthNav();
    await loadSavedAddresses();
    await loadWishlist();
    await loadCart();
    renderCurrentView();
    showToast(`Welcome, ${state.user.name}!`);
  } catch (err) {
    alert(err.message);
  }
}

function handleLogout() {
  state.user = null;
  state.token = null;
  localStorage.removeItem('ebook_user');
  localStorage.removeItem('ebook_token');
  renderAuthNav();
  navigate('home');
}

// ------------------------------------------------
// UTILS & TOAST
// ------------------------------------------------

function handleSearchInput(val) {
  state.searchQuery = val;
  renderHomeView();
}

function handleFilterChange(key, val) {
  state[key] = val;
  renderHomeView();
}

async function handleReviewSubmit(e, bookId) {
  e.preventDefault();
  if (!state.token) {
    openAuthModal();
    return;
  }
  const comment = document.getElementById('reviewText').value;
  try {
    await fetchWithAuth(`${API_BASE}/books/${bookId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: 5, comment })
    });
    showToast('Review submitted!');
    renderDetailView(bookId);
  } catch (err) {
    alert(err.message);
  }
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-6 right-6 bg-[#18191c] border border-[#2c2f36] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2';
  toast.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-[#16a34a]"></i> ${msg}`;
  document.body.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => toast.remove(), 2500);
}
