const screens = {
  home: document.querySelector("#home-screen"),
  categories: document.querySelector("#categories-screen"),
  listing: document.querySelector("#listing-screen"),
  detail: document.querySelector("#detail-screen"),
};

const shell = document.querySelector(".market-phone");
const navItems = Array.from(document.querySelectorAll("[data-view]"));

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
    box: '<svg viewBox="0 0 24 24"><path d="M4 9h16v11H4V9Z"></path><path d="M7 9V5h10v4M9 13h6"></path></svg>',
  };
  return icons[name] || "";
}

function installNavIcons() {
  document.querySelectorAll("[data-icon]").forEach((node) => {
    node.innerHTML = icon(node.dataset.icon);
  });
}

function setView(view) {
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle("is-active", key === view));
  navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.view === view));
  shell.classList.toggle("is-detail-view", view === "detail");
  window.scrollTo(0, 0);
}

function header({ title = "", mode = "brand", backTarget = "categories" } = {}) {
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

  if (mode === "detail") {
    return `
      <header class="green-head listing-head">
        <div class="status-row"><span>7:13</span><span class="status-icons">||| WiFi 57</span></div>
        <div class="titlebar">
          <button class="back-button" type="button" data-back="listing" aria-label="Back">${icon("back")}</button>
          <h1></h1>
          <div class="head-group">
            <button class="head-button" type="button" aria-label="Share">${icon("share")}</button>
            <button class="head-button" type="button" aria-label="Cart">${icon("bag")}</button>
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
          <button class="head-button" type="button" aria-label="Cart">${icon("bag")}</button>
        </div>
      </div>
      <div class="subtabs"><span class="is-active">All</span><span>Bake For You</span><span>Golden Swiss</span><span>Happy Family</span><span>Heritage Farm</span></div>
    </header>
  `;
}

function searchCard(flat = false) {
  return `
    <button class="search-card ${flat ? "is-flat" : ""}" type="button">
      <span class="icon">${icon("search")}</span>
      <span>Search products and categories</span>
      ${flat ? '<span class="icon"></span>' : `<span class="heart icon">${icon("heart")}</span>`}
    </button>
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

function productCard(product, compact = false) {
  return `
    <button class="product-card" type="button" data-product-id="${product.id}" onclick="event.stopPropagation(); window.openProductDetail('${product.id}')" aria-label="View ${product.name}">
      <div class="product-art">
        <img src="${getProductImage(product)}" alt="${product.name}" loading="lazy" />
      </div>
      <span class="add-mini" aria-hidden="true">${icon("plus")}</span>
      ${product.promo || product.oldPrice ? '<span class="deal-badge" aria-hidden="true"></span>' : ""}
      <div class="product-info">
        <h3>${product.name}</h3>
        <span class="weight">${product.weight}</span>
        <span class="price-row">
          <strong class="price ${product.oldPrice ? "is-sale" : ""}">$${product.price}</strong>
          ${product.oldPrice ? `<span class="old-price">$${product.oldPrice}</span>` : ""}
        </span>
      </div>
    </button>
  `;
}

function productsFor(categoryId) {
  const filtered = activeProducts.filter((product) => product.category === categoryId);
  return sortProductsByName(filtered.length ? filtered : activeProducts.slice(0, 12));
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

function renderDetail(productId = "bread-400") {
  const product = activeProducts.find((item) => item.id === productId) || activeProducts[0];
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
      <strong class="price">$${product.price}</strong>
      <button class="favorite" type="button" aria-label="Favorite">${icon("heart")}</button>
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
    <button class="detail-cta" type="button">Add to Cart</button>
  `;
}

function openProductDetail(productId) {
  renderDetail(productId);
  setView("detail");
}

window.openProductDetail = openProductDetail;

function bindEvents() {
  navItems.forEach((button) => {
    button.addEventListener("click", () => {
      setView(button.dataset.view);
    });
  });

  document.addEventListener("click", (event) => {
    const category = event.target.closest("[data-category-id]");
    if (category) {
      renderListing(category.dataset.categoryId);
      setView("listing");
      return;
    }

    const product = event.target.closest("[data-product-id]");
    if (product) {
      openProductDetail(product.dataset.productId);
      return;
    }

    const back = event.target.closest("[data-back]");
    if (back) {
      const previous = back.dataset.back === "categories" ? "categories" : "listing";
      setView(previous);
    }
  });
}

installNavIcons();
renderHome();
renderCategories();
renderListing();
renderDetail();
bindEvents();
