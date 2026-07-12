const screens = {
  home: document.querySelector("#home-screen"),
  categories: document.querySelector("#categories-screen"),
  listing: document.querySelector("#listing-screen"),
  detail: document.querySelector("#detail-screen"),
  favourites: document.querySelector("#favourites-screen"),
  cart: document.querySelector("#cart-screen"),
  search: document.querySelector("#search-screen"),
  checkout: document.querySelector("#checkout-screen"),
  addressForm: document.querySelector("#address-form-screen"),
  paymentForm: document.querySelector("#payment-form-screen"),
};

const shell = document.querySelector(".market-phone");
const navItems = Array.from(document.querySelectorAll("[data-view]"));
const favoriteProductIds = new Set();
const cartItems = new Map();
let previousView = "home";
let currentView = "home";
let searchQuery = "";
let checkoutStep = "address";
let savedAddress = null;
let selectedDeliverySlot = "";
let selectedRemark = "";
let savedPaymentMethod = null;

function svgUrl(markup) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`;
}

function productImage(kind, label, colors) {
  const [main, accent, cap] = colors;
  const shapes = {
    bread: `<path d="M108 36c32 0 58 25 58 56v98c0 17-14 31-31 31H81c-17 0-31-14-31-31V92c0-31 26-56 58-56Z" fill="${main}"/><path d="M62 72h92v98H62z" fill="${accent}"/><path d="M62 72h92v20H62z" fill="#173c91"/><path d="M108 10c28 5 49 22 61 50H47c12-28 33-45 61-50Z" fill="${cap}"/><path d="M58 77h12v89H58zm25 0h12v89H83zm25 0h12v89h-12zm25 0h12v89h-12z" stroke="#ffd738" stroke-width="8"/>`,
    jar: `<rect x="60" y="56" width="96" height="144" rx="22" fill="${main}"/><rect x="70" y="80" width="76" height="70" rx="8" fill="${accent}"/><rect x="57" y="38" width="102" height="28" rx="8" fill="${cap}"/><path d="M70 168h76" stroke="#b07942" stroke-width="8" stroke-linecap="round"/>`,
    bag: `<path d="M55 44h106l-10 160H65L55 44Z" fill="${main}"/><path d="M68 70h80v86H68z" fill="${accent}"/><path d="M74 31c18 18 50 18 68 0" stroke="${cap}" stroke-width="13" stroke-linecap="round"/>`,
    bottle: `<path d="M88 35h40v32c18 8 29 28 29 50v88H59v-88c0-22 11-42 29-50V35Z" fill="${main}"/><rect x="84" y="20" width="48" height="22" rx="5" fill="${cap}"/><rect x="70" y="98" width="76" height="54" rx="8" fill="${accent}"/>`,
    tray: `<rect x="38" y="72" width="140" height="96" rx="18" fill="${main}"/><rect x="50" y="86" width="116" height="64" rx="12" fill="${accent}"/><circle cx="82" cy="116" r="13" fill="${cap}"/><circle cx="115" cy="112" r="16" fill="${cap}"/><circle cx="139" cy="126" r="12" fill="${cap}"/>`,
    box: `<rect x="52" y="42" width="112" height="156" rx="10" fill="${main}"/><rect x="68" y="66" width="80" height="78" rx="8" fill="${accent}"/><path d="M80 174h56" stroke="${cap}" stroke-width="12" stroke-linecap="round"/>`,
    produce: `<circle cx="88" cy="104" r="38" fill="${main}"/><circle cx="127" cy="90" r="34" fill="${accent}"/><path d="M110 57c14-27 39-20 48-10-17 8-30 14-48 10Z" fill="${cap}"/>`,
  };

  return svgUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 216 240">
      <rect width="216" height="240" rx="18" fill="#fff"/>
      <g transform="translate(0 8)">${shapes[kind] || shapes.box}</g>
      <rect x="61" y="112" width="94" height="44" rx="8" fill="rgba(255,255,255,.9)"/>
      <text x="108" y="132" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#293136">${label}</text>
      <text x="108" y="148" text-anchor="middle" font-family="Arial" font-size="9" fill="#293136">ShengSiong</text>
    </svg>
  `);
}

function categoryImage(label, colors) {
  const [main, accent] = colors;
  return svgUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="22" fill="#fff"/>
      <circle cx="80" cy="72" r="38" fill="${main}" opacity=".92"/>
      <path d="M54 106h52c16 0 27 9 30 23H24c3-14 14-23 30-23Z" fill="${accent}" opacity=".92"/>
      <text x="80" y="82" text-anchor="middle" font-family="Arial" font-size="28" font-weight="900" fill="#fff">${label}</text>
    </svg>
  `);
}

const categories = [
  { id: "housebrands", name: "Our Housebrands", short: "SS", colors: ["#f6c04a", "#fff0a0"] },
  { id: "local", name: "Support Local", short: "SG", colors: ["#df2f2f", "#f6f6f6"] },
  { id: "breakfast", name: "Breakfast & Spreads", short: "BF", colors: ["#b77949", "#ffe3ba"] },
  { id: "dairy", name: "Dairy, Chilled & Eggs", short: "ML", colors: ["#6db7ff", "#eef8ff"] },
  { id: "fruits", name: "Fruits", short: "FR", colors: ["#80c64a", "#eaffc4"] },
  { id: "vegetables", name: "Vegetables", short: "VG", colors: ["#38a855", "#c7f5be"] },
  { id: "meat", name: "Meat, Poultry & Seafood", short: "MT", colors: ["#de6c73", "#ffe2e5"] },
  { id: "beverages", name: "Beverages", short: "BV", colors: ["#d92626", "#ecf4ff"] },
  { id: "alcohol", name: "Alcohol", short: "AL", colors: ["#27894a", "#d7f2d9"] },
  { id: "rice", name: "Rice, Noodles & Pasta", short: "RP", colors: ["#e6cb72", "#fff3cf"] },
  { id: "frozen", name: "Frozen Goods", short: "FZ", colors: ["#f08a32", "#ffefd6"] },
  { id: "dried", name: "Dried Food & Herbs", short: "DH", colors: ["#c63b2e", "#ffe1cd"] },
  { id: "cooking", name: "Cooking & Baking", short: "CB", colors: ["#e93d36", "#fff7d6"] },
  { id: "convenience", name: "Convenience Food", short: "CF", colors: ["#f7d86a", "#fff3c4"] },
  { id: "snacks", name: "Snacks & Confectioneries", short: "SC", colors: ["#f6db2f", "#fff6b5"] },
  { id: "baby", name: "Mum, Baby & Kids", short: "BK", colors: ["#6aa0d8", "#eaf3ff"] },
  { id: "household", name: "Household", short: "HH", colors: ["#40a6a1", "#d7fffb"] },
  { id: "health", name: "Health & Beauty", short: "HB", colors: ["#8a80d8", "#f0edff"] },
];

const products = [
  { id: "bread-400", category: "housebrands", name: "Bake For You Enriched White Bread", weight: "400 g", price: "1.95", brand: "Bake For You", sku: "484892", origin: "Singapore", dietary: ["Halal"], kind: "bread", colors: ["#173c91", "#e84431", "#173c91"] },
  { id: "pb-crunchy", category: "housebrands", name: "Bake For You Peanut Butter - Crunchy", weight: "510 g", price: "3.55", oldPrice: "3.80", brand: "Bake For You", origin: "Malaysia", sku: "471029", dietary: ["Halal"], kind: "jar", colors: ["#b9773a", "#7b1f38", "#e5322d"] },
  { id: "pb-creamy", category: "housebrands", name: "Bake For You Peanut Butter - Creamy", weight: "510 g", price: "3.55", oldPrice: "3.80", brand: "Bake For You", origin: "Malaysia", sku: "471030", dietary: ["Halal"], kind: "jar", colors: ["#ba7437", "#243f88", "#234daa"] },
  { id: "pb-nosugar", category: "housebrands", name: "Bake For You Creamy Peanut Butter - No Added Sugar & Salt", weight: "340 g", price: "2.95", oldPrice: "3.50", brand: "Bake For You", origin: "Malaysia", sku: "471034", dietary: ["Halal"], kind: "jar", colors: ["#bd7b40", "#21975d", "#22a751"] },
  { id: "kaya-less", category: "housebrands", name: "Bake For You Nonya Kaya - Less Sugar", weight: "400 g", price: "3.80", brand: "Bake For You", origin: "Singapore", sku: "492816", dietary: ["Halal"], kind: "jar", colors: ["#c68a4e", "#f6e2ac", "#c5a656"] },
  { id: "kaya-honey", category: "housebrands", name: "Bake For You Hainanese Kaya With Honey", weight: "400 g", price: "3.80", promo: "Buy 2 for $8.95", brand: "Bake For You", origin: "Singapore", sku: "492817", dietary: ["Halal"], kind: "jar", colors: ["#b87638", "#764631", "#d4b15c"] },
  { id: "bread-jumbo", category: "breakfast", name: "Bake For You Jumbo Enriched White Bread", weight: "600 g", price: "2.50", brand: "Bake For You", origin: "Singapore", sku: "484893", dietary: ["Halal"], kind: "bread", colors: ["#173c91", "#e84431", "#173c91"] },
  { id: "wholemeal-jumbo", category: "breakfast", name: "Bake For You Jumbo 600 Enriched Wholemeal White Bread", weight: "600 g", price: "2.95", brand: "Bake For You", origin: "Singapore", sku: "484894", dietary: ["Halal"], kind: "bread", colors: ["#14a35b", "#d53631", "#0ca45c"] },
  { id: "super-bread", category: "breakfast", name: "Super Value Enriched Wholemeal Bread", weight: "600 g", price: "2.30", brand: "Super Value", origin: "Singapore", sku: "310188", kind: "bread", colors: ["#2452ad", "#f4d43b", "#2452ad"] },
  { id: "gardenia", category: "breakfast", name: "Gardenia White Bread (Jumbo 600)", weight: "600 g", price: "3.20", brand: "Gardenia", origin: "Singapore", sku: "306144", kind: "bread", colors: ["#148a42", "#fff0be", "#148a42"] },
  { id: "cheese-cowhead", category: "dairy", name: "Cowhead Cheddar Cheese Slices Pack", weight: "3 x 250 g", price: "9.40", brand: "Cowhead", origin: "Australia", sku: "552910", kind: "box", colors: ["#f6cd3a", "#204b8e", "#e5362e"] },
  { id: "philadelphia", category: "dairy", name: "Philadelphia Cream Cheese Block", weight: "250 g", price: "6.67", brand: "Philadelphia", origin: "Australia", sku: "552911", kind: "box", colors: ["#dfefff", "#254f9b", "#254f9b"] },
  { id: "banana", category: "fruits", name: "Ecuador / Philippines Cavendish Banana", weight: "1 - 1.2 kg", price: "3.65", brand: "Fresh Produce", origin: "Ecuador", sku: "102211", kind: "produce", colors: ["#f5d238", "#ffeb70", "#43a55c"] },
  { id: "fuji", category: "fruits", name: "China Fuji Apple", weight: "1 pc", price: "0.95", promo: "Buy 5 for $3.25", brand: "Fresh Produce", origin: "China", sku: "102218", kind: "produce", colors: ["#dd302d", "#f79854", "#48a65d"] },
  { id: "carrot", category: "vegetables", name: "Australia / China Carrots", weight: "850-900 g", price: "1.68", brand: "Fresh Produce", origin: "Australia / China", sku: "204004", kind: "produce", colors: ["#f1842f", "#f7b15f", "#42a65d"] },
  { id: "radish", category: "vegetables", name: "China / Malaysia White Radish", weight: "750-850 g", price: "1.26", brand: "Fresh Produce", origin: "China / Malaysia", sku: "204010", kind: "produce", colors: ["#eff2e8", "#bcd86c", "#42a65d"] },
  { id: "minced-chicken", category: "meat", name: "Jean Fresh Frozen Minced Chicken", weight: "400 g", price: "4.77", promo: "Any 2 for $8.20", brand: "Jean Fresh", origin: "Singapore", sku: "331280", kind: "tray", colors: ["#363d46", "#f1d1cf", "#df5e63"] },
  { id: "salmon", category: "meat", name: "Jean Fresh Frozen Salmon Fillet", weight: "800 g", price: "28.34", brand: "Jean Fresh", origin: "Norway", sku: "331300", kind: "tray", colors: ["#363d46", "#ff9f86", "#ff6b4e"] },
  { id: "milo-900", category: "beverages", name: "Milo Original", weight: "900 g", price: "10.45", brand: "Milo", origin: "Singapore", sku: "651910", kind: "bag", colors: ["#158c44", "#f6d638", "#0c6831"] },
  { id: "milo-uht", category: "beverages", name: "Milo UHT Chocolate Malt Packet Drink", weight: "1 L", price: "3.15", brand: "Milo", origin: "Singapore", sku: "651911", kind: "box", colors: ["#138944", "#f4df38", "#138944"] },
  { id: "tiger", category: "alcohol", name: "Tiger Original Lager Beer", weight: "320 ml", price: "2.42", brand: "Tiger", origin: "Singapore", sku: "701912", kind: "bottle", colors: ["#f1bc1d", "#174a9c", "#d64624"] },
  { id: "carlsberg", category: "alcohol", name: "Carlsberg Danish Pilsner Beer", weight: "320 ml", price: "2.63", brand: "Carlsberg", origin: "Denmark", sku: "701913", kind: "bottle", colors: ["#0e8f45", "#ffffff", "#0e8f45"] },
  { id: "tai-sun", category: "rice", name: "Tai Sun Bee Hoon Rice Vermicelli", weight: "400 g", price: "1.26", brand: "Tai Sun", origin: "Singapore", sku: "801010", kind: "bag", colors: ["#f4ebca", "#e5372f", "#f2c044"] },
  { id: "happy-vermicelli", category: "rice", name: "Happy Family Lungkow Vermicelli", weight: "250 g", price: "1.89", promo: "Buy 3 for $3.95", brand: "Happy Family", origin: "China", sku: "801020", kind: "bag", colors: ["#f8f0d3", "#d72525", "#f1c74a"] },
  { id: "dried-chilli", category: "dried", name: "Happy Family Dried Chilli", weight: "150 g", price: "2.05", brand: "Happy Family", origin: "China", sku: "889001", kind: "bag", colors: ["#d72828", "#fff2d7", "#b41c1c"] },
  { id: "coconut", category: "cooking", name: "Kara Coconut Cream", weight: "200 ml", price: "1.26", promo: "Buy 2 for $2.15", brand: "Kara", origin: "Indonesia", sku: "901120", kind: "box", colors: ["#1b9d6a", "#ffffff", "#ef3333"] },
  { id: "sardine", category: "convenience", name: "Happy Family Sardine In Tomato Sauce", weight: "425 g", price: "2.78", brand: "Happy Family", origin: "Thailand", sku: "942210", kind: "box", colors: ["#e5382d", "#ffe6a5", "#1d5da8"] },
  { id: "oreo", category: "snacks", name: "Oreo Original", weight: "9 x 27.6 g", price: "3.20", promo: "Any 2 for $5.70", brand: "Oreo", origin: "Indonesia", sku: "991221", kind: "box", colors: ["#154ca0", "#ffffff", "#154ca0"] },
];

const catalog = window.SHENGSIONG_CATALOG || {};
const activeCategories = Array.isArray(catalog.categories) && catalog.categories.length ? catalog.categories : categories;
const activeProducts = Array.isArray(catalog.products) && catalog.products.length ? catalog.products : products;

function icon(name) {
  const icons = {
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m16.5 16.5 4 4"></path></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M20.8 5.8c-2-2.2-5.2-2-6.9.3L12 8.4l-1.9-2.3c-1.8-2.3-5-2.5-6.9-.3-2.1 2.4-1.6 6.1 1 8.2l7.8 6.4 7.8-6.4c2.6-2.1 3.1-5.8 1-8.2Z"></path></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3v-9.5Z"></path></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1"></rect><rect x="14" y="4" width="6" height="6" rx="1"></rect><rect x="4" y="14" width="6" height="6" rx="1"></rect><rect x="14" y="14" width="6" height="6" rx="1"></rect></svg>',
    scan: '<svg viewBox="0 0 24 24"><rect x="5" y="5" width="5" height="5"></rect><rect x="14" y="5" width="5" height="5"></rect><rect x="5" y="14" width="5" height="5"></rect><path d="M14 14h3v3h3v3h-6v-6Z"></path></svg>',
    ticket: '<svg viewBox="0 0 24 24"><path d="M5 6h14v4a2 2 0 0 0 0 4v4H5v-4a2 2 0 0 0 0-4V6Z"></path><path d="M9 8v8"></path></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8Z"></path><path d="M9 8a3 3 0 0 1 6 0"></path></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"></path></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M20 12 13 5v4C7 9 4 12 3 18c2-3 5-4 10-4v5l7-7Z"></path></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>',
    minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"></path></svg>',
    box: '<svg viewBox="0 0 24 24"><path d="M4 9h16v11H4V9Z"></path><path d="M7 9V5h10v4M9 13h6"></path></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16"></path><path d="M10 11v6M14 11v6"></path><path d="M6 7l1 14h10l1-14"></path><path d="M9 7V4h6v3"></path></svg>',
    map: '<svg viewBox="0 0 24 24"><path d="M12 21s7-5.3 7-11a7 7 0 0 0-14 0c0 5.7 7 11 7 11Z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"></rect><path d="M8 3v4M16 3v4M4 10h16"></path></svg>',
    card: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"></rect><path d="M3 10h18M7 15h4"></path></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"></path><path d="m14 7 3 3"></path></svg>',
  };
  return icons[name] || "";
}

function installNavIcons() {
  document.querySelectorAll("[data-icon]").forEach((node) => {
    node.innerHTML = icon(node.dataset.icon);
  });
}

function cartQuantity(productId) {
  return cartItems.get(productId) || 0;
}

function cartCount() {
  return Array.from(cartItems.values()).reduce((sum, qty) => sum + qty, 0);
}

function cartSubtotal() {
  return Array.from(cartItems.entries()).reduce((sum, [productId, qty]) => {
    const product = activeProducts.find((item) => item.id === productId);
    return sum + (product ? Number(product.price || 0) * qty : 0);
  }, 0);
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function cartBadge() {
  const count = cartCount();
  return `<span class="cart-badge ${count ? "is-visible" : ""}" data-cart-count>${count || ""}</span>`;
}

function updateCartBadges() {
  const count = cartCount();
  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.textContent = count ? String(count) : "";
    badge.classList.toggle("is-visible", count > 0);
  });
}

function setView(view) {
  if (view !== currentView) {
    previousView = currentView;
    currentView = view;
  }
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle("is-active", key === view));
  navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.view === view));
  shell.classList.toggle("is-detail-view", ["detail", "favourites", "search", "checkout", "addressForm", "paymentForm"].includes(view));
  window.scrollTo(0, 0);
  updateCartBadges();
}

function header({ title = "", mode = "brand", backTarget = "categories", showSubtabs = true } = {}) {
  if (mode === "brand") {
    return `
      <header class="green-head">
        <div class="status-row"><span>7:11</span><span class="status-icons">||| WiFi 57</span></div>
        <div class="brand-row">
          <span class="brand-mark">S</span>
          <span class="brand-type">SHENGSIONG<small>... all for you!</small></span>
        </div>
        <span class="avatar" aria-hidden="true"></span>
      </header>
    `;
  }

  if (mode === "title") {
    return `
      <header class="green-head">
        <div class="status-row"><span>7:11</span><span class="status-icons">||| WiFi 57</span></div>
        <h1 class="page-title">${title}</h1>
      </header>
    `;
  }

  if (mode === "cart") {
    return `
      <header class="green-head">
        <div class="status-row"><span>3:52</span><span class="status-icons">||| WiFi 83</span></div>
        <div class="cart-titlebar">
          <h1>Cart</h1>
          <button class="head-button" type="button" data-clear-cart aria-label="Clear cart">${icon("trash")}</button>
        </div>
      </header>
    `;
  }

  if (mode === "checkout") {
    return `
      <header class="green-head checkout-head">
        <div class="status-row"><span>7:28</span><span class="status-icons">||| WiFi 51</span></div>
        <div class="checkout-titlebar">
          <button class="back-button" type="button" data-checkout-back aria-label="Back">${icon("back")}</button>
          <h1>${title}</h1>
        </div>
      </header>
    `;
  }

  if (mode === "detail") {
    return `
      <header class="green-head listing-head">
        <div class="status-row"><span>7:13</span><span class="status-icons">||| WiFi 57</span></div>
        <div class="titlebar">
          <button class="back-button" type="button" data-back="previous" aria-label="Back">${icon("back")}</button>
          <h1></h1>
          <div class="head-group">
            <button class="head-button" type="button" aria-label="Share">${icon("share")}</button>
            <button class="head-button has-badge" type="button" data-go-cart aria-label="Cart">${icon("bag")}${cartBadge()}</button>
          </div>
        </div>
      </header>
    `;
  }

  return `
    <header class="green-head listing-head">
      <div class="status-row"><span>7:13</span><span class="status-icons">||| WiFi 57</span></div>
      <div class="titlebar">
        <button class="back-button" type="button" data-back="${backTarget}" aria-label="Back">${icon("back")}</button>
        <h1>${title}</h1>
        <div class="head-group">
          <button class="head-button" type="button" aria-label="Search">${icon("search")}</button>
          <button class="head-button has-badge" type="button" data-go-cart aria-label="Cart">${icon("bag")}${cartBadge()}</button>
        </div>
      </div>
      ${showSubtabs ? '<div class="subtabs"><span class="is-active">All</span><span>Bake For You</span><span>Golden Swiss</span><span>Happy Family</span><span>Heritage Farm</span></div>' : ""}
    </header>
  `;
}

function searchCard(flat = false) {
  return `
    <div class="search-card ${flat ? "is-flat" : ""}">
      <form class="search-main" data-search-form>
        <span class="icon">${icon("search")}</span>
        <input type="search" name="query" value="${searchQuery}" placeholder="Search products and categories" autocomplete="off" data-search-input />
      </form>
      ${flat ? '<span class="icon"></span>' : `<button class="heart icon" type="button" data-open-favourites aria-label="Open favourites">${icon("heart")}</button>`}
    </div>
  `;
}

function getProductLabel(product) {
  return (product.brand || product.name || "SS").trim().split(/\s+/)[0] || "SS";
}

function getProductImage(product) {
  return product.imageUrl || productImage(product.kind, getProductLabel(product), product.colors || ["#12a848", "#f5f5f5", "#04782f"]);
}

function sortProductsByName(items) {
  return [...items].sort((a, b) => (a.name || "").localeCompare(b.name || "", "en", { sensitivity: "base", numeric: true }));
}

function quantityControl(product, variant = "card") {
  const qty = cartQuantity(product.id);
  if (!qty) {
    return `<button class="add-mini" type="button" data-cart-action="increase" data-cart-product-id="${product.id}" onclick="event.stopPropagation(); window.changeCartQuantity('${product.id}', 1)" aria-label="Add ${product.name}">${icon("plus")}</button>`;
  }

  return `
    <div class="quantity-control quantity-control--${variant}" data-cart-product-id="${product.id}">
      <button type="button" data-cart-action="decrease" data-cart-product-id="${product.id}" onclick="event.stopPropagation(); window.changeCartQuantity('${product.id}', -1)" aria-label="Decrease ${product.name}">${icon("minus")}</button>
      <span>${qty}</span>
      <button type="button" data-cart-action="increase" data-cart-product-id="${product.id}" onclick="event.stopPropagation(); window.changeCartQuantity('${product.id}', 1)" aria-label="Increase ${product.name}">${icon("plus")}</button>
    </div>
  `;
}

function productCard(product, compact = false) {
  return `
    <article class="product-card" data-open-product="${product.id}" onclick="event.stopPropagation(); window.openProductDetail('${product.id}')">
      <button class="product-open" type="button" data-open-product="${product.id}" onclick="event.stopPropagation(); window.openProductDetail('${product.id}')" aria-label="View ${product.name}">
        <span class="product-art">
          <img src="${getProductImage(product)}" alt="${product.name}" loading="lazy" />
        </span>
      </button>
      ${quantityControl(product)}
      ${product.promo || product.oldPrice ? '<span class="deal-badge" aria-hidden="true"></span>' : ""}
      <div class="product-info product-info-button" data-open-product="${product.id}" onclick="event.stopPropagation(); window.openProductDetail('${product.id}')" role="button" tabindex="0" aria-label="View ${product.name}">
        <h3>${product.name}</h3>
        <span class="weight">${product.weight}</span>
        <span class="price-row">
          <strong class="price ${product.oldPrice ? "is-sale" : ""}">$${product.price}</strong>
          ${product.oldPrice ? `<span class="old-price">$${product.oldPrice}</span>` : ""}
        </span>
      </div>
    </article>
  `;
}

function productsFor(categoryId) {
  const filtered = activeProducts.filter((product) => product.category === categoryId);
  return sortProductsByName(filtered.length ? filtered : activeProducts.slice(0, 12));
}

function searchableText(product) {
  return [
    product.name,
    product.brand,
    product.weight,
    product.rawCategory,
    product.categoryName,
    product.tags?.join(" "),
  ].filter(Boolean).join(" ").toLowerCase();
}

function searchProducts(query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) {
    return [];
  }

  return sortProductsByName(activeProducts.filter((product) => {
    const haystack = searchableText(product);
    return terms.every((term) => haystack.includes(term));
  }));
}

function renderHome() {
  screens.home.innerHTML = `
    ${header()}
    ${searchCard()}
    <div class="banner-stack">
      <article class="promo-banner tea">
        <span class="can green">POKKA<br/>SENCHA</span>
        <span class="can orange">POKKA<br/>TEA</span>
        <div class="banner-copy">
          <h2>THE TASTE OF TRANQUILITY</h2>
          <p>Online exclusive tea promotion inspired by Sheng Siong's retail campaign style.</p>
        </div>
        <div class="exclusive"><small>ONLINE EXCLUSIVE</small>Redeem a FREE collapsible lunch box with $18 spend</div>
      </article>
      <article class="promo-banner delivery">
        <h2>FREE DELIVERY</h2>
        <p>NOW WITH MINIMUM SPEND $69</p>
        <span class="bag-visual">SS<br/>BAG</span>
        <span class="truck">SHENG<br/>SIONG</span>
      </article>
    </div>
    <div class="section-head"><h2>Retail Promotions</h2><button type="button">See More &gt;</button></div>
    <div class="promo-strip">
      <div class="promo-tile">$2,500,000 Grand Lucky Draw</div>
      <div class="promo-tile blue">Fresh eggs and chilled deals</div>
    </div>
    <p class="source-note">Showing ${activeProducts.length} products exported from the current Sheng Siong Online catalog.</p>
  `;
}

function renderSearch() {
  const results = searchProducts(searchQuery);
  const trimmed = searchQuery.trim();
  screens.search.innerHTML = `
    ${header({ title: "Search", mode: "listing", backTarget: "previous", showSubtabs: false })}
    ${searchCard(true)}
    <div class="search-result-head">
      <h2>${trimmed ? `${results.length} result${results.length === 1 ? "" : "s"} for "${trimmed}"` : "Search products"}</h2>
    </div>
    ${trimmed ? (results.length ? `<div class="product-grid">${results.map((product) => productCard(product)).join("")}</div>` : '<div class="empty-state">No products found.</div>') : '<div class="empty-state">Type a product, brand, or category.</div>'}
  `;
}

function renderCategories() {
  screens.categories.innerHTML = `
    ${header({ title: "Categories", mode: "title" })}
    ${searchCard(true)}
    <div class="categories-grid">
      ${activeCategories.map((category) => `
        <button class="category-card" type="button" data-category-id="${category.id}">
          <span class="category-image"><img src="${category.imageUrl || categoryImage(category.short, category.colors)}" alt="" loading="lazy" /></span>
          <strong>${category.name}</strong>
        </button>
      `).join("")}
    </div>
  `;
}

function renderListing(categoryId = "housebrands") {
  const category = activeCategories.find((item) => item.id === categoryId) || activeCategories[0];
  const categoryProducts = productsFor(category.id);
  screens.listing.innerHTML = `
    ${header({ title: category.name, mode: "listing", backTarget: "categories" })}
    <div class="filters">
      ${["Brands", "Pricing", "Dietary", "Origin", "Tags"].map((item) => `<button class="filter-chip" type="button">${item}⌄</button>`).join("")}
    </div>
    <div class="product-grid">
      ${categoryProducts.map((product) => productCard(product)).join("")}
    </div>
  `;
  screens.listing.dataset.categoryId = category.id;
}

function favouriteProducts() {
  return sortProductsByName(activeProducts.filter((product) => favoriteProductIds.has(product.id)));
}

function renderFavourites() {
  const favourites = favouriteProducts();
  screens.favourites.innerHTML = `
    ${header({ title: "My Favourites", mode: "listing", backTarget: "home", showSubtabs: false })}
    <div class="filters">
      ${["Categories", "Brands", "Pricing", "Dietary", "Origin"].map((item) => `<button class="filter-chip" type="button">${item}⌄</button>`).join("")}
    </div>
    ${favourites.length ? `<div class="product-grid">${favourites.map((product) => productCard(product)).join("")}</div>` : '<div class="empty-state">No favourite products yet.</div>'}
  `;
}

function cartProducts() {
  return Array.from(cartItems.entries())
    .map(([productId, qty]) => ({ product: activeProducts.find((item) => item.id === productId), qty }))
    .filter((item) => item.product);
}

function renderCart() {
  const items = cartProducts();
  const subtotal = cartSubtotal();
  const deliveryTarget = 69;
  const remaining = Math.max(deliveryTarget - subtotal, 0);
  const progress = Math.min((subtotal / deliveryTarget) * 100, 100);

  screens.cart.innerHTML = `
    ${header({ mode: "cart" })}
    <div class="cart-content">
      ${items.length ? items.map(({ product }) => `
        <article class="cart-line">
          <button class="cart-product-image" type="button" data-open-product="${product.id}">
            <img src="${getProductImage(product)}" alt="${product.name}" loading="lazy" />
          </button>
          <div class="cart-line-info">
            <h3>${product.name}</h3>
            <span>${product.weight}</span>
            <strong>${formatMoney(product.price)}</strong>
          </div>
          ${quantityControl(product, "cart")}
        </article>
      `).join("") : '<div class="empty-state">Your cart is empty.</div>'}
    </div>
    <section class="cart-summary">
      <p>${remaining > 0 ? `${formatMoney(remaining)} to free delivery` : "Free delivery unlocked"}</p>
      <div class="delivery-progress"><span style="width:${progress}%"></span></div>
      <div class="checkout-row">
        <strong>Subtotal: <span>${formatMoney(subtotal)}</span></strong>
        <button type="button" data-start-checkout>Check Out</button>
      </div>
    </section>
  `;
}

function checkoutStepper(activeStep) {
  const steps = [
    { id: "address", icon: "map" },
    { id: "schedule", icon: "calendar" },
    { id: "payment", icon: "card" },
    { id: "review", icon: "box" },
  ];
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === activeStep));
  const progress = activeIndex === 0 ? "0px" : `calc((100% - 56px) / 3 * ${activeIndex})`;

  return `
    <div class="checkout-steps" style="--checkout-progress: ${progress}">
      ${steps.map((step, index) => `
        <span class="checkout-step ${index <= activeIndex ? "is-done" : ""} ${index === activeIndex ? "is-current" : ""}">
          ${icon(step.icon)}
        </span>
      `).join("")}
    </div>
  `;
}

function renderAddressSummary() {
  if (!savedAddress) {
    return `
      <section class="checkout-empty">
        <div class="pin-illustration"><span></span></div>
        <h3>No addresses saved</h3>
        <p>To continue checking out, please add a delivery address</p>
        <button class="primary-wide" type="button" data-add-address>Add New Address</button>
      </section>
    `;
  }

  return `
    <section class="checkout-address">
      <button class="edit-address" type="button" data-edit-address aria-label="Edit address">${icon("edit")}</button>
      <article class="address-card">
        <strong>${savedAddress.name}</strong>
        <span>${savedAddress.line}</span>
        <span>+65 ${savedAddress.mobile}</span>
      </article>
      <div class="map-preview" aria-hidden="true"><span class="map-pin"></span><strong>Google</strong></div>
      <button class="primary-wide checkout-fixed" type="button" data-checkout-continue>Continue</button>
    </section>
  `;
}

function renderScheduleStep() {
  const slots = [
    { id: "10:00am - 1:00pm", status: "Not available (Full)", disabled: true },
    { id: "1:00pm - 4:00pm", status: "Available" },
    { id: "4:00pm - 7:00pm", status: "Available" },
    { id: "6:00pm - 9:00pm", status: "Available" },
  ];
  const remarks = [
    "Please call upon arrival.",
    "Contactless delivery. Please leave the items at my doorstep.",
    "Allow earlier delivery. Please call to confirm.",
  ];

  return `
    <div class="schedule-days">
      ${[
        ["Wed", "27 May"],
        ["Thu", "28 May"],
        ["Fri", "29 May"],
        ["Sat", "30 May"],
        ["Sun", "31 May"],
        ["Mon", "1 Jun"],
      ].map(([day, date]) => `<button class="${day === "Fri" ? "is-active" : ""}" type="button"><strong>${day}</strong><span>${date}</span></button>`).join("")}
    </div>
    <div class="slot-list">
      ${slots.map((slot) => `
        <button class="slot-card ${slot.disabled ? "is-disabled" : ""} ${selectedDeliverySlot === slot.id ? "is-selected" : ""}" type="button" data-select-slot="${slot.id}" ${slot.disabled ? "disabled" : ""}>
          <span><strong>${slot.id}</strong><small>${slot.status}</small></span>
          <i></i>
        </button>
      `).join("")}
    </div>
    ${selectedDeliverySlot ? `
      <section class="remarks-section">
        <h3>Remarks</h3>
        ${remarks.map((remark) => `
          <button class="remark-card ${selectedRemark === remark ? "is-selected" : ""}" type="button" data-select-remark="${remark}">
            <span>${remark}</span><i></i>
          </button>
        `).join("")}
      </section>
    ` : ""}
    <button class="primary-wide checkout-fixed" type="button" data-checkout-continue ${selectedDeliverySlot ? "" : "disabled"}>Continue</button>
  `;
}

function renderPaymentStep() {
  if (!savedPaymentMethod) {
    return `
      <section class="checkout-empty payment-empty">
        <div class="card-illustration"><span></span></div>
        <h3>No payment methods added</h3>
        <p>To continue checking out, please add a payment method</p>
        <button class="primary-wide" type="button" data-add-payment>Add New Payment Method</button>
      </section>
    `;
  }

  return `
    <section class="payment-list">
      <article class="payment-method">
        <span class="payment-chip">${savedPaymentMethod.brand}</span>
        <strong>${savedPaymentMethod.name}</strong>
        <span>${savedPaymentMethod.brand} ending ${savedPaymentMethod.last4}</span>
      </article>
      <button class="primary-wide checkout-fixed" type="button" data-checkout-continue>Place Order</button>
    </section>
  `;
}

function renderCheckout() {
  const titles = {
    address: "Delivery Address",
    schedule: "Select Delivery Schedule",
    payment: "Select Payment Method",
  };

  screens.checkout.innerHTML = `
    ${header({ title: "Checkout", mode: "checkout" })}
    <main class="checkout-page">
      ${checkoutStepper(checkoutStep)}
      <h2 class="checkout-heading">${titles[checkoutStep]}</h2>
      ${checkoutStep === "address" ? renderAddressSummary() : checkoutStep === "schedule" ? renderScheduleStep() : renderPaymentStep()}
    </main>
  `;
}

function renderAddressForm() {
  screens.addressForm.innerHTML = `
    ${header({ title: "Add New Address", mode: "checkout" })}
    <form class="address-form" data-address-form>
      <label><strong>Recipient Name</strong><input name="name" placeholder="Recipient Name" value="${savedAddress?.name || ""}" /></label>
      <label><strong>Mobile Number</strong><input name="mobile" placeholder="+65 Mobile Number" value="${savedAddress?.mobile || ""}" /></label>
      <label class="wide"><strong>Address</strong><span class="search-input-wrap">${icon("search")}<input name="street" placeholder="Enter your postal code or street name" value="${savedAddress?.street || ""}" /></span></label>
      <label><strong>Floor</strong><input name="floor" placeholder="Floor" value="${savedAddress?.floor || ""}" /></label>
      <label><strong>Unit Number</strong><input name="unit" placeholder="Unit Number" value="${savedAddress?.unit || ""}" /></label>
      <label class="wide"><strong>Additional Details</strong><input name="details" placeholder="Additional Address Details" value="${savedAddress?.details || ""}" /></label>
      <div class="form-toggle"><span>Set this address as default</span><button type="button" aria-label="Set default"></button></div>
      <button class="primary-wide form-save" type="submit">Save</button>
    </form>
  `;
}

function renderPaymentForm() {
  screens.paymentForm.innerHTML = `
    ${header({ title: "Add Payment Method", mode: "checkout" })}
    <form class="address-form payment-form" data-payment-form>
      <label class="wide"><strong>Cardholder Name</strong><input name="name" placeholder="Cardholder Name" value="${savedPaymentMethod?.name || ""}" /></label>
      <label class="wide"><strong>Card Number</strong><input name="number" inputmode="numeric" placeholder="Card Number" /></label>
      <label><strong>Expiry Date</strong><input name="expiry" placeholder="MM/YY" /></label>
      <label><strong>CVV</strong><input name="cvv" inputmode="numeric" placeholder="CVV" /></label>
      <button class="primary-wide form-save" type="submit">Save</button>
    </form>
  `;
}

function renderDetail(productId = "bread-400") {
  const product = activeProducts.find((item) => item.id === productId) || activeProducts[0];
  const isFavourite = favoriteProductIds.has(product.id);
  const similar = sortProductsByName(activeProducts.filter((item) => item.id !== product.id && item.category === product.category)).slice(0, 6);
  const sameBrand = sortProductsByName(activeProducts.filter((item) => item.id !== product.id && product.brand && item.brand === product.brand)).slice(0, 6);

  screens.detail.classList.add("detail-screen");
  screens.detail.innerHTML = `
    ${header({ mode: "detail" })}
    <div class="detail-hero">
      <img src="${getProductImage(product)}" alt="${product.name}" />
    </div>
    <section class="detail-main">
      <h1>${product.name}</h1>
      <div class="weight">${product.weight}</div>
      <div class="detail-price-row">
        <strong class="price">$${product.price}</strong>
        <button class="favorite ${isFavourite ? "is-active" : ""}" type="button" data-favourite-id="${product.id}" aria-label="Favorite">${icon("heart")}</button>
      </div>
    </section>
    <section class="detail-section">
      <h2>Dietary</h2>
      ${(product.dietary && product.dietary.length ? product.dietary : product.tags && product.tags.length ? product.tags : ["Fresh"]).map((tag) => `<span class="pill">${tag}</span>`).join("")}
    </section>
    <div class="spec-row"><strong>Category</strong><span>${product.rawCategory || product.categoryName || product.category}</span></div>
    <div class="spec-row"><strong>Origin</strong><span>${product.origin || "Not specified"}</span></div>
    <div class="spec-row"><strong>SKU</strong><span>${product.sku || product.slug || product.id}</span></div>
    <section class="detail-section">
      <h2>Similar Products</h2>
    </section>
    <div class="horizontal-products">${similar.map((item) => productCard(item, true)).join("")}</div>
    <section class="detail-section">
      <h2>Same Brand</h2>
    </section>
    <div class="horizontal-products">${(sameBrand.length ? sameBrand : similar).map((item) => productCard(item, true)).join("")}</div>
    <div class="detail-cta-wrap">${cartQuantity(product.id) ? quantityControl(product, "detail") : `<button class="detail-cta" type="button" data-cart-action="increase" data-cart-product-id="${product.id}" onclick="event.stopPropagation(); window.changeCartQuantity('${product.id}', 1)">Add to Cart</button>`}</div>
  `;
}

function toggleFavorite(productId) {
  if (favoriteProductIds.has(productId)) {
    favoriteProductIds.delete(productId);
  } else {
    favoriteProductIds.add(productId);
  }

  renderDetail(productId);
  renderFavourites();
}

function refreshCurrentView(productId = null) {
  if (currentView === "listing") {
    renderListing(screens.listing.dataset.categoryId || "housebrands");
  } else if (currentView === "detail" && productId) {
    renderDetail(productId);
  } else if (currentView === "favourites") {
    renderFavourites();
  } else if (currentView === "cart") {
    renderCart();
  } else if (currentView === "search") {
    renderSearch();
  } else if (currentView === "checkout") {
    renderCheckout();
  }
  updateCartBadges();
}

function goToView(view) {
  if (view === "listing") {
    renderListing(screens.listing.dataset.categoryId || "housebrands");
  } else if (view === "favourites") {
    renderFavourites();
  } else if (view === "cart") {
    renderCart();
  } else if (view === "home") {
    renderHome();
  } else if (view === "categories") {
    renderCategories();
  } else if (view === "search") {
    renderSearch();
  } else if (view === "checkout") {
    renderCheckout();
  } else if (view === "addressForm") {
    renderAddressForm();
  } else if (view === "paymentForm") {
    renderPaymentForm();
  }
  setView(view);
}

function changeCartQuantity(productId, delta) {
  const nextQty = Math.max(0, cartQuantity(productId) + delta);
  if (nextQty === 0) {
    cartItems.delete(productId);
  } else {
    cartItems.set(productId, nextQty);
  }

  renderCart();
  if (currentView !== "cart") {
    refreshCurrentView(productId);
  } else {
    updateCartBadges();
  }
}

window.changeCartQuantity = changeCartQuantity;

function openProductDetail(productId) {
  renderDetail(productId);
  setView("detail");
}

window.openProductDetail = openProductDetail;

function bindEvents() {
  navItems.forEach((button) => {
    button.addEventListener("click", () => {
      goToView(button.dataset.view);
    });
  });

  document.addEventListener("click", (event) => {
    const cartAction = event.target.closest("[data-cart-action]");
    if (cartAction) {
      event.preventDefault();
      event.stopPropagation();
      changeCartQuantity(cartAction.dataset.cartProductId, cartAction.dataset.cartAction === "increase" ? 1 : -1);
      return;
    }

    const goCart = event.target.closest("[data-go-cart]");
    if (goCart) {
      event.preventDefault();
      goToView("cart");
      return;
    }

    const clearCart = event.target.closest("[data-clear-cart]");
    if (clearCart) {
      event.preventDefault();
      cartItems.clear();
      renderCart();
      refreshCurrentView();
      return;
    }

    const startCheckout = event.target.closest("[data-start-checkout]");
    if (startCheckout) {
      event.preventDefault();
      if (!cartCount()) {
        return;
      }
      checkoutStep = "address";
      goToView("checkout");
      return;
    }

    const addAddress = event.target.closest("[data-add-address], [data-edit-address]");
    if (addAddress) {
      event.preventDefault();
      goToView("addressForm");
      return;
    }

    const addPayment = event.target.closest("[data-add-payment]");
    if (addPayment) {
      event.preventDefault();
      goToView("paymentForm");
      return;
    }

    const selectedSlot = event.target.closest("[data-select-slot]");
    if (selectedSlot) {
      event.preventDefault();
      selectedDeliverySlot = selectedSlot.dataset.selectSlot;
      renderCheckout();
      return;
    }

    const selectedRemarkButton = event.target.closest("[data-select-remark]");
    if (selectedRemarkButton) {
      event.preventDefault();
      const remark = selectedRemarkButton.dataset.selectRemark;
      selectedRemark = selectedRemark === remark ? "" : remark;
      renderCheckout();
      return;
    }

    const checkoutContinue = event.target.closest("[data-checkout-continue]");
    if (checkoutContinue) {
      event.preventDefault();
      if (checkoutStep === "address" && savedAddress) {
        checkoutStep = "schedule";
      } else if (checkoutStep === "schedule" && selectedDeliverySlot) {
        checkoutStep = "payment";
      } else if (checkoutStep === "payment" && savedPaymentMethod) {
        cartItems.clear();
        checkoutStep = "address";
        goToView("cart");
        renderCart();
        return;
      }
      goToView("checkout");
      return;
    }

    const checkoutBack = event.target.closest("[data-checkout-back]");
    if (checkoutBack) {
      event.preventDefault();
      if (currentView === "addressForm" || currentView === "paymentForm") {
        goToView("checkout");
      } else if (checkoutStep === "payment") {
        checkoutStep = "schedule";
        goToView("checkout");
      } else if (checkoutStep === "schedule") {
        checkoutStep = "address";
        goToView("checkout");
      } else {
        goToView("cart");
      }
      return;
    }

    const category = event.target.closest("[data-category-id]");
    if (category) {
      renderListing(category.dataset.categoryId);
      setView("listing");
      return;
    }

    const product = event.target.closest("[data-open-product]");
    if (product) {
      openProductDetail(product.dataset.openProduct);
      return;
    }

    const favouriteButton = event.target.closest("[data-favourite-id]");
    if (favouriteButton) {
      event.preventDefault();
      toggleFavorite(favouriteButton.dataset.favouriteId);
      return;
    }

    const favouritesEntry = event.target.closest("[data-open-favourites]");
    if (favouritesEntry) {
      event.preventDefault();
      goToView("favourites");
      return;
    }

    const back = event.target.closest("[data-back]");
    if (back) {
      const target = back.dataset.back;
      if (target === "previous") {
        goToView(previousView === "detail" ? "home" : previousView);
      } else {
        goToView(target === "categories" ? "categories" : target === "home" ? "home" : "listing");
      }
    }
  });

  document.addEventListener("submit", (event) => {
    const addressForm = event.target.closest("[data-address-form]");
    if (addressForm) {
      event.preventDefault();
      const data = new FormData(addressForm);
      const name = String(data.get("name") || "").trim() || "Zhiq";
      const mobile = String(data.get("mobile") || "").trim().replace(/^\+65\s*/, "") || "8576 4206";
      const street = String(data.get("street") || "").trim() || "26 Sunshine Terrace";
      const floor = String(data.get("floor") || "").trim() || "11";
      const unit = String(data.get("unit") || "").trim() || "4";
      const details = String(data.get("details") || "").trim();
      savedAddress = {
        name,
        mobile,
        street,
        floor,
        unit,
        details,
        line: `${street} #${floor}-${unit} S(535703)`,
      };
      checkoutStep = "address";
      goToView("checkout");
      return;
    }

    const paymentForm = event.target.closest("[data-payment-form]");
    if (paymentForm) {
      event.preventDefault();
      const data = new FormData(paymentForm);
      const name = String(data.get("name") || "").trim() || "Saved Card";
      const number = String(data.get("number") || "").replace(/\D/g, "");
      const last4 = number.slice(-4) || "4242";
      savedPaymentMethod = {
        name,
        last4,
        brand: number.startsWith("5") ? "Mastercard" : "Visa",
      };
      checkoutStep = "payment";
      goToView("checkout");
      return;
    }

    const form = event.target.closest("[data-search-form]");
    if (!form) {
      return;
    }

    event.preventDefault();
    const input = form.querySelector("[data-search-input]");
    searchQuery = input ? input.value : "";
    goToView("search");
  });

  document.addEventListener("input", (event) => {
    const input = event.target.closest("[data-search-input]");
    if (!input) {
      return;
    }

    searchQuery = input.value;
    if (searchQuery.trim()) {
      renderSearch();
      setView("search");
      const searchInput = screens.search.querySelector("[data-search-input]");
      if (searchInput) {
        searchInput.focus();
        searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
      }
    } else if (currentView === "search") {
      renderSearch();
    }
  });
}

installNavIcons();
renderHome();
renderCategories();
renderListing();
renderDetail();
renderFavourites();
renderCart();
renderSearch();
renderCheckout();
renderAddressForm();
renderPaymentForm();
bindEvents();
updateCartBadges();
