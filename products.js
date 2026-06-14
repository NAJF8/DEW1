import { ADMIN_CONFIG } from './config/admin.config.js';
import { seedProducts } from './products-data.js';

const STORAGE_KEY = 'dew.products.v1';
const ADMIN_SESSION_KEY = 'dew.admin.unlocked.v1';
const PRODUCT_IMAGE_DIR = './assets/images/products';
const PAGE_IMAGE_DIR = './assets/images/pages';
const IDLE_LOGOUT_TIMER_KEY = 'dew.admin.idle.timer.v1';

const SECTION_ORDER = [
  'popular',
  'hot',
  'cold',
  'specialty',
  'frappe',
  'milkshake',
  'matcha',
  'smoothie',
  'mohito',
  'juice',
  'iced-tea',
  'tea',
  'special',
  'sweets',
];

const SECTION_META = {
  popular: { ar: 'الأكثر طلباً', en: 'Most Popular', icon: 'Best Seller' },
  hot: { ar: 'مشروبات ساخنة', en: 'Hot Drinks', icon: '☕' },
  cold: { ar: 'مشروبات باردة', en: 'Cold Drinks', icon: '🧊' },
  specialty: { ar: 'قائمة الأيس لاتيه الحصرية', en: 'Specialty Iced Lattes', icon: '🥤' },
  frappe: { ar: 'فرابيه', en: 'Frappé', icon: '🍧' },
  milkshake: { ar: 'ميلك شيك', en: 'Milkshakes', icon: '🍫' },
  matcha: { ar: 'ماتشا', en: 'Matcha', icon: '🍵' },
  smoothie: { ar: 'سموذي', en: 'Smoothies', icon: '🍓' },
  mohito: { ar: 'موهيتو', en: 'Mohito', icon: '🌿' },
  juice: { ar: 'العصائر', en: 'Juices', icon: '🍊' },
  'iced-tea': { ar: 'شاي مثلج', en: 'Iced Tea', icon: '🍑' },
  tea: { ar: 'الشاي', en: 'Tea', icon: '🫖' },
  special: { ar: 'سبشل', en: 'Special Drinks', icon: '🌟' },
  sweets: { ar: 'الحلويات', en: 'Sweets', icon: '🍰' },
};

const SECTION_VISUALS = {
  hot: [
    { page: 38, layout: 'grid9', count: 9 },
    { page: 39, layout: 'layout5', count: 5 },
    { page: 40, layout: 'grid9', count: 8 },
  ],
  cold: [
    { page: 46, layout: 'layout8', count: 8 },
    { page: 41, layout: 'layout2', count: 2 },
  ],
  specialty: [{ page: 42, layout: 'grid9', count: 9 }],
  frappe: [{ page: 47, layout: 'layout5', count: 5 }],
  milkshake: [
    { page: 37, layout: 'grid9', count: 9 },
    { page: 43, layout: 'layout2', count: 2 },
  ],
  matcha: [{ page: 52, layout: 'layout4', count: 4 }],
  smoothie: [{ page: 49, layout: 'grid9', count: 9 }],
  mohito: [{ page: 51, layout: 'layout8', count: 8 }],
  juice: [{ page: 48, layout: 'layout5', count: 5 }],
  'iced-tea': [{ page: 53, layout: 'layout7', count: 7 }],
  tea: [{ page: 45, layout: 'layout3', count: 3 }],
  special: [{ page: 50, layout: 'layout2', count: 2 }],
  sweets: [{ page: 44, layout: 'grid9', count: 9 }],
};

const DEFAULT_EXTRA_PRODUCTS = [
  {
    id: 'cold-iced-coffee',
    section: 'cold',
    nameAr: 'آيس كوفي',
    nameEn: 'Iced Coffee',
    price: '5,000 IQD',
    premium: true,
    wide: false,
    popular: true,
    custom: true,
    image: `${PRODUCT_IMAGE_DIR}/cold-iced-coffee.jpg`,
    order: 999,
  },
];

const DEFAULT_POPULAR_NAMES = ['Donut', 'Croissant', 'Iced Coffee'];

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[\u0600-\u06ff]+/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'product';
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getAdminSessionUnlocked() {
  return Boolean(getAdminSessionRecord());
}

function now() {
  return Date.now();
}

function getAdminSessionRecord() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw);
    if (!record || typeof record !== 'object') return null;
    if (!Number.isFinite(record.expiresAt) || record.expiresAt <= now()) return null;
    if (record.token !== `${ADMIN_CONFIG.sessionTokenPrefix}:${record.expiresAt}`) return null;
    return record;
  } catch {
    return null;
  }
}

function setAdminSessionUnlocked(value, ttl = ADMIN_CONFIG.sessionTtlMs) {
  if (typeof window === 'undefined') return;
  try {
    if (!value) {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return;
    }
    const expiresAt = now() + ttl;
    const payload = { expiresAt, token: ADMIN_CONFIG.sessionTokenPrefix + ':' + expiresAt };
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(payload));
  } catch {
    return;
  }
}

async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(String(input));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(value) {
  return sha256Hex(`${ADMIN_CONFIG.salt}:${value}`);
}

async function verifyAdminPassword(value) {
  return (await hashPassword(value)) === ADMIN_CONFIG.passwordHash;
}

function markActivity() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(IDLE_LOGOUT_TIMER_KEY, String(now()));
  } catch {
    return;
  }
}

function clearIdleTimer() {
  if (typeof window === 'undefined') return;
  if (window.__dewAdminIdleTimer) {
    window.clearTimeout(window.__dewAdminIdleTimer);
    window.__dewAdminIdleTimer = null;
  }
}

function syncIdleTimer(onExpire) {
  if (typeof window === 'undefined') return;
  clearIdleTimer();
  const timeout = Math.max(60_000, Number(ADMIN_CONFIG.idleLogoutMs) || 20 * 60_000);
  const tick = () => {
    const last = Number(window.sessionStorage.getItem(IDLE_LOGOUT_TIMER_KEY) || now());
    const remaining = Math.max(0, timeout - (now() - last));
    clearIdleTimer();
    window.__dewAdminIdleTimer = window.setTimeout(() => {
      onExpire();
    }, remaining);
  };
  tick();
  ['pointerdown', 'keydown', 'scroll', 'mousemove', 'touchstart'].forEach((eventName) => {
    window.addEventListener(
      eventName,
      () => {
        markActivity();
        tick();
      },
      { passive: true, capture: true }
    );
  });
}

function installSecurityGuards() {
  if (typeof window === 'undefined') return;
  if (window.__dewSecurityGuardsInstalled) return;
  window.__dewSecurityGuardsInstalled = true;
  window.addEventListener(
    'contextmenu',
    (event) => {
      event.preventDefault();
    },
    { capture: true }
  );
  window.addEventListener(
    'keydown',
    (event) => {
      const key = String(event.key || '').toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const blocked =
        key === 'f12' ||
        (ctrl && shift && (key === 'i' || key === 'j' || key === 'c')) ||
        (ctrl && key === 'u');
      if (blocked) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    { capture: true }
  );
}

function ensureOrder(products) {
  const counters = new Map();
  return products.map((product, index) => {
    const section = product.section || 'hot';
    const next = (counters.get(section) || 0) + 1;
    counters.set(section, next);
    return {
      ...product,
      id: product.id || `${section}-${next}`,
      section,
      order: Number.isFinite(product.order) ? product.order : next,
      premium: Boolean(product.premium),
      wide: Boolean(product.wide),
      popular: Boolean(product.popular),
      custom: Boolean(product.custom),
      image: product.image || '',
      updatedAt: product.updatedAt || index,
    };
  });
}

function seedCatalog() {
  const base = clone(seedProducts).map((product, index) => ({
    ...product,
    order: index + 1,
    popular: DEFAULT_POPULAR_NAMES.some(
      (name) =>
        product.nameEn?.toLowerCase() === name.toLowerCase() ||
        product.nameAr?.includes(name)
    ),
    custom: false,
    image: product.image || '',
  }));
  const extras = DEFAULT_EXTRA_PRODUCTS.map((product) => ({ ...product }));
  return ensureOrder([...base, ...extras]);
}

export function loadProducts() {
  if (typeof window === 'undefined') return seedCatalog();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = seedCatalog();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? ensureOrder(parsed) : seedCatalog();
    if (!list.some((p) => p.id === 'cold-iced-coffee')) {
      list.push({ ...DEFAULT_EXTRA_PRODUCTS[0] });
    }
    return ensureOrder(list);
  } catch {
    return seedCatalog();
  }
}

export function saveProducts(products) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ensureOrder(products)));
}

export function resetProducts() {
  const fresh = seedCatalog();
  saveProducts(fresh);
  return fresh;
}

export function upsertProduct(product) {
  const products = loadProducts();
  const next = { ...product };
  if (!next.id) {
    next.id = `${next.section || 'product'}-${Date.now()}`;
  }
  const index = products.findIndex((item) => item.id === next.id);
  if (index >= 0) products[index] = { ...products[index], ...next };
  else products.push(next);
  saveProducts(products);
  return products;
}

export function deleteProduct(id) {
  const products = loadProducts().filter((product) => product.id !== id);
  saveProducts(products);
  return products;
}

export function getSections() {
  return SECTION_ORDER.filter((section) => section !== 'popular').map((section) => ({
    id: section,
    ...SECTION_META[section],
  }));
}

function groupedProducts(products) {
  const map = new Map(SECTION_ORDER.map((section) => [section, []]));
  for (const product of products) {
    if (!map.has(product.section)) map.set(product.section, []);
    map.get(product.section).push(product);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.order - b.order) || a.nameEn.localeCompare(b.nameEn));
  }
  return map;
}

function layoutBoxes(layout) {
  switch (layout) {
    case 'grid9':
      return [
        [40, 380, 325, 780], [410, 380, 695, 780], [780, 380, 1065, 780],
        [40, 1120, 325, 1520], [410, 1120, 695, 1520], [780, 1120, 1065, 1520],
        [40, 1860, 325, 2260], [410, 1860, 695, 2260], [780, 1860, 1065, 2260],
      ];
    case 'layout8':
      return [
        [40, 420, 325, 900], [410, 420, 695, 900], [780, 420, 1065, 900],
        [40, 1180, 325, 1660], [410, 1180, 695, 1660], [780, 1180, 1065, 1660],
        [40, 1940, 325, 2360], [410, 1940, 695, 2360],
      ];
    case 'layout7':
      return [
        [40, 420, 325, 900], [410, 420, 695, 900], [780, 420, 1065, 900],
        [40, 1180, 325, 1660], [410, 1180, 695, 1660], [780, 1180, 1065, 1660],
        [220, 1940, 900, 2380],
      ];
    case 'layout5':
      return [
        [50, 320, 450, 930], [730, 320, 1120, 930],
        [50, 1060, 450, 1670], [730, 1060, 1120, 1670],
        [350, 1750, 830, 2360],
      ];
    case 'layout4':
      return [
        [40, 420, 540, 1180], [620, 420, 1120, 1180],
        [40, 1240, 540, 2200], [620, 1240, 1120, 2200],
      ];
    case 'layout3':
      return [
        [40, 720, 480, 1760], [360, 610, 845, 1510], [730, 720, 1130, 1760],
      ];
    case 'layout2':
      return [
        [50, 720, 530, 1860], [640, 720, 1120, 1860],
      ];
    default:
      return [];
  }
}

function mediaForProduct(product, index) {
  if (product.image) return { src: product.image, focus: '50% 45%' };
  const groups = SECTION_VISUALS[product.section] || [{ page: 44, layout: 'grid9', count: 9 }];
  let offset = index;
  for (const group of groups) {
    if (offset < group.count) {
      const boxes = layoutBoxes(group.layout);
      const box = boxes[Math.min(offset, boxes.length - 1)] || boxes[0];
      const [x1, y1, x2, y2] = box;
      const x = (((x1 + x2) / 2) / 1178) * 100;
      const y = (((y1 + y2) / 2) / 2560) * 100;
      return {
        src: `${PRODUCT_IMAGE_DIR}/${product.id}.jpg`,
        focus: `${x.toFixed(1)}% ${y.toFixed(1)}%`,
        fallback: `${PAGE_IMAGE_DIR}/page-${String(group.page).padStart(2, '0')}.jpg`,
      };
    }
    offset -= group.count;
  }
  const fallback = groups[groups.length - 1] || { page: 44 };
  return {
    src: `${PRODUCT_IMAGE_DIR}/${product.id}.jpg`,
    focus: '50% 50%',
    fallback: `${PAGE_IMAGE_DIR}/page-${String(fallback.page).padStart(2, '0')}.jpg`,
  };
}

function cardTemplate(product, index, total, { popular = false } = {}) {
  const media = mediaForProduct(product, index);
  const badge = popular ? '<span class="card-badge">Best Seller</span>' : '';
  const wideClass = product.wide ? ' wide' : '';
  const premiumClass = product.premium ? ' premium' : '';
  const popularClass = product.popular ? ' is-popular' : '';
  const customClass = product.custom ? ' is-custom' : '';
  return `
    <article class="item-card${wideClass}${popularClass}${customClass}" data-product-id="${esc(product.id)}">
      <div class="item-img-wrap">
        <img
          src="${esc(media.src)}"
          data-fallback="${esc(media.fallback || media.src)}"
          alt="${esc(product.nameEn || product.nameAr)}"
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
          style="object-position:${esc(media.focus)}"
          onerror="this.onerror=null;this.src=this.dataset.fallback;this.style.objectPosition='50% 45%'"
        >
        ${badge}
      </div>
      <div class="item-info">
        <div class="item-name-ar">${esc(product.nameAr || product.nameEn)}</div>
        <div class="item-name-en">${esc(product.nameEn || '')}</div>
        <div class="item-price${premiumClass}">${esc(product.price || '')}</div>
      </div>
    </article>
  `;
}

function popularProducts(products) {
  const marked = products.filter((product) => product.popular);
  const byName = new Map(marked.map((product) => [product.nameEn?.toLowerCase(), product]));
  const result = [];
  for (const name of DEFAULT_POPULAR_NAMES) {
    const product = byName.get(name.toLowerCase());
    if (product && !result.includes(product)) result.push(product);
  }
  if (result.length < 3) {
    for (const product of marked) {
      if (!result.includes(product)) result.push(product);
      if (result.length >= 3) break;
    }
  }
  if (!result.some((product) => product.id === 'cold-iced-coffee')) {
    const iced = products.find((product) => product.id === 'cold-iced-coffee');
    if (iced) result.push(iced);
  }
  return result.slice(0, 3);
}

function buildHeader() {
  return `
    <header class="site-header">
      <div class="brand">
        <div class="brand-mark">DEW</div>
        <div>
          <div class="brand-name">DEW Coffee</div>
          <div class="brand-sub">Coffee & More</div>
        </div>
      </div>
      <div class="brand-ribbon">Fresh menu, local edits, instant updates</div>
    </header>
  `;
}

function buildHero(products) {
  const total = products.length;
  const sections = getSections().length;
  const popularCount = popularProducts(products).length;
  return `
    <section class="hero">
      <div class="hero-kicker">Since 2024</div>
      <h1 class="hero-title">DEW</h1>
      <div class="hero-address">
        <span>النجف الأشرف</span>
        <span>حي الأمير</span>
        <span>شارع كلية التربية للبنات</span>
      </div>
      <p class="hero-copy">قهوة ومشروبات وحلويات بطابع DEW المميز، مع منيو يتحدث تلقائياً من لوحة الإدارة.</p>
      <div class="hero-stats">
        <div class="stat-chip">
          <strong>${total}</strong>
          <span>منتج</span>
        </div>
        <div class="stat-chip">
          <strong>${sections}</strong>
          <span>قسم</span>
        </div>
        <div class="stat-chip accent">
          <strong>${popularCount}</strong>
          <span>الأكثر طلباً</span>
        </div>
      </div>
    </section>
  `;
}

function buildPopularSection(products) {
  const items = popularProducts(products);
  const cards = items
    .map((product, index) => cardTemplate(product, index, items.length, { popular: true }))
    .join('');
  return `
    <section id="popular" class="section popular-section">
      <div class="section-header compact">
        <div class="section-icon hot">${SECTION_META.popular.icon}</div>
        <div>
          <div class="section-title-ar">${SECTION_META.popular.ar}</div>
          <div class="section-title-en">${SECTION_META.popular.en}</div>
        </div>
      </div>
      <div class="popular-grid">${cards}</div>
    </section>
  `;
}

function buildNav() {
  const buttons = getSections()
    .map(
      (section) => `
        <button class="nav-tab" data-target="${esc(section.id)}">${esc(section.icon)} ${esc(section.ar)}</button>
      `
    )
    .join('');
  return `
    <nav class="nav-scroll" aria-label="menu sections">
      <div class="nav-tabs">
        <button class="nav-tab active" data-target="popular">🔥 ${esc(SECTION_META.popular.ar)}</button>
        ${buttons}
      </div>
    </nav>
  `;
}

function buildSectionSection(section, products) {
  const list = products.filter((product) => product.section === section.id);
  const cards = list.map((product, index) => cardTemplate(product, index, list.length)).join('');
  return `
    <section id="${esc(section.id)}" class="section">
      <div class="section-header">
        <div class="section-icon">${esc(section.icon)}</div>
        <div>
          <div class="section-title-ar">${esc(section.ar)}</div>
          <div class="section-title-en">${esc(section.en)}</div>
        </div>
      </div>
      <div class="items-grid${section.id === 'sweets' ? ' sweets-grid' : ''}">
        ${cards}
      </div>
    </section>
  `;
}

export function renderMenu(root) {
  installSecurityGuards();
  const products = loadProducts();
  const sections = getSections();
  const markup = `
    ${buildHeader()}
    ${buildHero(products)}
    ${buildPopularSection(products)}
    ${buildNav()}
    <main class="menu-shell">
      ${sections.map((section) => buildSectionSection(section, products)).join('')}
    </main>
    <footer class="site-footer">
      <div class="footer-brand">DEW</div>
      <div>Coffee & More · منيو ديناميكي من ملفات محلية</div>
    </footer>
  `;
  root.innerHTML = markup;
  bindMenuInteractions(root);

  if (typeof window !== 'undefined' && !window.__dewMenuStorageSync) {
    window.__dewMenuStorageSync = true;
    window.addEventListener('storage', (event) => {
      if (event.key !== STORAGE_KEY) return;
      const app = document.getElementById('app');
      if (app) renderMenu(app);
    });
  }
}

function bindMenuInteractions(root) {
  const tabs = root.querySelectorAll('.nav-tab');
  const sections = root.querySelectorAll('.section');
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const id = visible.target.id;
      tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.target === id));
    },
    { root: null, threshold: 0.3 }
  );
  sections.forEach((section) => observer.observe(section));

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = document.getElementById(tab.dataset.target);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      tabs.forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

function productRow(product) {
  return `
    <tr data-product-id="${esc(product.id)}">
      <td>
        <div class="table-preview">
          <img src="${esc(mediaForProduct(product, 0).src)}" alt="${esc(product.nameEn || product.nameAr)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${PAGE_IMAGE_DIR}/page-44.jpg'">
        </div>
      </td>
      <td>
        <div class="table-title">${esc(product.nameAr || '')}</div>
        <div class="table-sub">${esc(product.nameEn || '')}</div>
      </td>
      <td>${esc(product.section)}</td>
      <td>${esc(product.price || '')}</td>
      <td>${product.popular ? 'Yes' : 'No'}</td>
      <td>${product.custom ? 'Custom' : 'Seed'}</td>
      <td>
        <button class="ghost-btn" data-action="edit" data-id="${esc(product.id)}">Edit</button>
        <button class="ghost-btn danger" data-action="delete" data-id="${esc(product.id)}">Delete</button>
      </td>
    </tr>
  `;
}

function adminShell() {
  return `
    <div class="admin-shell">
      <aside class="admin-side">
        <div class="admin-brand">
          <div class="admin-mark">DEW</div>
          <div>
            <h1>Admin</h1>
            <p>Manage menu items without a database.</p>
          </div>
        </div>
        <div class="admin-note">
          Changes are stored locally in the browser and reflected instantly in the menu.
        </div>
        <div class="admin-section-nav">
          <button class="admin-chip" data-jump="editor">Add / Edit</button>
          <button class="admin-chip" data-jump="catalog">Catalog</button>
          <button class="admin-chip" data-jump="popular">Most Popular</button>
          <button class="admin-chip" data-jump="settings">Settings</button>
        </div>
      </aside>
      <section class="admin-main">
        <div class="admin-topbar">
          <div>
            <h2>Product Manager</h2>
            <p>Edit, add, delete, or promote items to Most Popular.</p>
          </div>
          <div class="admin-actions">
            <button class="ghost-btn" id="resetDefaults">Reset Defaults</button>
            <button class="ghost-btn" id="exportJson">Export JSON</button>
            <button class="primary-btn" id="newProduct">New Product</button>
          </div>
        </div>
        <div class="admin-stats-grid">
          <div class="mini-stat">
            <span>Total items</span>
            <strong id="adminTotal">0</strong>
          </div>
          <div class="mini-stat accent">
            <span>Popular items</span>
            <strong id="adminPopular">0</strong>
          </div>
          <div class="mini-stat">
            <span>Custom items</span>
            <strong id="adminCustom">0</strong>
          </div>
          <div class="mini-stat">
            <span>Sections</span>
            <strong id="adminSections">0</strong>
          </div>
        </div>

        <div class="admin-grid">
          <form class="card panel editor-panel" id="productForm">
            <div class="panel-head" id="editor">
              <div>
                <h3>Add / Edit Product</h3>
                <p>Update name, price, image, section, or popular flag.</p>
              </div>
              <div class="editor-id" id="editorState">New item</div>
            </div>
            <input type="hidden" id="productId">
            <div class="preview-shell">
              <div class="preview-frame">
                <img id="imagePreview" alt="Preview" src="${PAGE_IMAGE_DIR}/page-44.jpg">
              </div>
              <div class="preview-meta">
                <strong>Live preview</strong>
                <span>Upload a file or paste a path and it updates instantly.</span>
              </div>
            </div>
            <label>
              Arabic Name
              <input id="nameAr" type="text" required>
            </label>
            <label>
              English Name
              <input id="nameEn" type="text" required>
            </label>
            <label>
              Section
              <select id="section"></select>
            </label>
            <label>
              Price
              <input id="price" type="text" placeholder="5,000 IQD" required>
            </label>
            <div class="inline-fields">
              <label class="check">
                <input id="popular" type="checkbox">
                <span>Most Popular</span>
              </label>
              <label class="check">
                <input id="premium" type="checkbox">
                <span>Premium</span>
              </label>
              <label class="check">
                <input id="wide" type="checkbox">
                <span>Wide Card</span>
              </label>
            </div>
            <label>
              Image URL or upload
              <input id="image" type="text" placeholder="Paste a URL or upload a file below">
            </label>
            <label>
              Upload image
              <input id="file" type="file" accept="image/*">
            </label>
            <div class="inline-fields">
              <label class="check">
                <input id="clearImage" type="checkbox">
                <span>Reset image to PDF crop</span>
              </label>
            </div>
            <div class="form-actions">
              <button type="submit" class="primary-btn">Save Product</button>
              <button type="button" class="ghost-btn" id="clearForm">Clear</button>
            </div>
          </form>

          <div class="right-stack">
            <div class="card panel table-panel" id="catalog">
            <div class="panel-head">
              <div>
                <h3>Catalog</h3>
                <p>Built-in items plus anything added from this screen. Click Edit to load an item back into the form.</p>
              </div>
              <div class="search-stack">
                <select id="sectionFilter" class="search">
                  <option value="">All sections</option>
                </select>
                <input id="search" class="search" type="search" placeholder="Search products...">
              </div>
            </div>
            <div class="table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Section</th>
                    <th>Price</th>
                    <th>Popular</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="catalogBody"></tbody>
              </table>
            </div>
          </div>

            <div class="card panel popular-panel" id="popular">
              <div class="panel-head">
                <div>
                  <h3>Most Popular</h3>
                  <p>These items are pinned to the top menu section and can be changed anytime.</p>
                </div>
              </div>
              <div id="popularList" class="popular-admin-list"></div>
            </div>

            <div class="card panel settings-panel" id="settings">
              <div class="panel-head">
                <div>
                  <h3>Settings</h3>
                  <p>Quick controls for the current browser session.</p>
                </div>
              </div>
              <div class="settings-grid">
                <button type="button" class="ghost-btn" id="resetFormState">Load empty form</button>
                <button type="button" class="ghost-btn" id="refreshCatalog">Refresh catalog</button>
                <button type="button" class="ghost-btn" id="closeSession">Lock admin</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function renderAdmin(root) {
  installSecurityGuards();
  const mountApp = () => {
    root.innerHTML = adminShell();
    initAdminApp(root);
  };

  if (getAdminSessionUnlocked()) {
    mountApp();
    syncIdleTimer(() => {
      setAdminSessionUnlocked(false);
      window.location.reload();
    });
    return;
  }

  root.innerHTML = `
    <div class="admin-lock" id="adminLock" aria-modal="true" role="dialog">
      <div class="card lock-card">
        <h2>Admin Access</h2>
        <p>Enter the manager code to unlock editing.</p>
        <input id="adminCode" type="password" placeholder="Manager code" autocomplete="one-time-code">
        <button class="primary-btn" id="unlockAdmin">Unlock</button>
      </div>
    </div>
  `;
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';

  const lock = root.querySelector('#adminLock');
  const codeInput = root.querySelector('#adminCode');
  const unlockButton = root.querySelector('#unlockAdmin');

  const unlock = async () => {
    if (!(await verifyAdminPassword(codeInput.value.trim()))) {
      codeInput.focus();
      codeInput.select();
      return;
    }
    setAdminSessionUnlocked(true);
    markActivity();
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    lock?.remove();
    mountApp();
    syncIdleTimer(() => {
      setAdminSessionUnlocked(false);
      window.location.reload();
    });
  };

  unlockButton.addEventListener('click', unlock);
  codeInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') unlock();
  });
}

function initAdminApp(app) {
  if (!getAdminSessionUnlocked()) {
    app.innerHTML = '';
    return;
  }
  const form = app.querySelector('#productForm');
  const body = app.querySelector('#catalogBody');
  const search = app.querySelector('#search');
  const sectionFilter = app.querySelector('#sectionFilter');
  const sectionSelect = app.querySelector('#section');
  const idInput = app.querySelector('#productId');
  const nameAr = app.querySelector('#nameAr');
  const nameEn = app.querySelector('#nameEn');
  const price = app.querySelector('#price');
  const popular = app.querySelector('#popular');
  const premium = app.querySelector('#premium');
  const wide = app.querySelector('#wide');
  const image = app.querySelector('#image');
  const file = app.querySelector('#file');
  const clearImage = app.querySelector('#clearImage');
  const clearForm = app.querySelector('#clearForm');
  const newProduct = app.querySelector('#newProduct');
  const resetDefaults = app.querySelector('#resetDefaults');
  const exportJson = app.querySelector('#exportJson');
  const resetFormState = app.querySelector('#resetFormState');
  const refreshCatalog = app.querySelector('#refreshCatalog');
  const closeSession = app.querySelector('#closeSession');
  const imagePreview = app.querySelector('#imagePreview');
  const editorState = app.querySelector('#editorState');
  const popularList = app.querySelector('#popularList');
  const totalStat = app.querySelector('#adminTotal');
  const popularStat = app.querySelector('#adminPopular');
  const customStat = app.querySelector('#adminCustom');
  const sectionsStat = app.querySelector('#adminSections');
  const sectionJumpButtons = app.querySelectorAll('[data-jump]');

  sectionSelect.innerHTML = getSections()
    .map((section) => `<option value="${esc(section.id)}">${esc(section.ar)} (${esc(section.en)})</option>`)
    .join('');
  sectionFilter.innerHTML += getSections()
    .map((section) => `<option value="${esc(section.id)}">${esc(section.ar)}</option>`)
    .join('');

  let products = loadProducts();
  let draftImage = '';
  let selectedSectionFilter = '';

  function refresh() {
    products = loadProducts();
    const query = search.value.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const hay = `${product.nameAr} ${product.nameEn} ${product.section}`.toLowerCase();
      const sectionMatch = !selectedSectionFilter || product.section === selectedSectionFilter;
      return sectionMatch && (!query || hay.includes(query));
    });
    body.innerHTML = filtered.map((product) => productRow(product)).join('');
    totalStat.textContent = String(products.length);
    popularStat.textContent = String(products.filter((product) => product.popular).length);
    customStat.textContent = String(products.filter((product) => product.custom).length);
    sectionsStat.textContent = String(getSections().length);
    popularList.innerHTML = popularProducts(products)
      .map(
        (product) => `
          <button type="button" class="popular-pill" data-load-id="${esc(product.id)}">
            <span>${esc(product.nameAr || product.nameEn)}</span>
            <small>${esc(product.price || '')}</small>
          </button>
        `
      )
      .join('');
  }

  function clearDraft() {
    idInput.value = '';
    form.reset();
    draftImage = '';
    image.value = '';
    clearImage.checked = false;
    sectionSelect.value = 'hot';
    popular.checked = false;
    premium.checked = false;
    wide.checked = false;
    editorState.textContent = 'New item';
    imagePreview.src = `${PAGE_IMAGE_DIR}/page-44.jpg`;
  }

  function loadDraft(product) {
    idInput.value = product.id || '';
    nameAr.value = product.nameAr || '';
    nameEn.value = product.nameEn || '';
    sectionSelect.value = product.section || 'hot';
    price.value = product.price || '';
    popular.checked = Boolean(product.popular);
    premium.checked = Boolean(product.premium);
    wide.checked = Boolean(product.wide);
    image.value = product.image || '';
    draftImage = product.image || '';
    clearImage.checked = false;
    editorState.textContent = `Editing: ${product.nameEn || product.id}`;
    imagePreview.src = mediaForProduct(product, 0).src || `${PAGE_IMAGE_DIR}/page-44.jpg`;
  }

  function getDraft() {
    const imageValue = clearImage.checked ? '' : (draftImage || image.value.trim());
    return {
      id: idInput.value || `${sectionSelect.value}-${slugify(nameEn.value || nameAr.value)}-${Date.now()}`,
      nameAr: nameAr.value.trim(),
      nameEn: nameEn.value.trim(),
      section: sectionSelect.value,
      price: price.value.trim(),
      popular: popular.checked,
      premium: premium.checked,
      wide: wide.checked,
      image: imageValue,
      custom: true,
    };
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const draft = getDraft();
    const current = loadProducts();
    const index = current.findIndex((product) => product.id === draft.id);
    if (index >= 0) current[index] = { ...current[index], ...draft, updatedAt: Date.now() };
    else current.push({ ...draft, order: current.filter((p) => p.section === draft.section).length + 1, updatedAt: Date.now() });
    saveProducts(current);
    clearDraft();
    refresh();
  });

  body.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const product = loadProducts().find((item) => item.id === button.dataset.id);
    if (!product) return;
    if (button.dataset.action === 'delete') {
      deleteProduct(product.id);
      refresh();
      return;
    }
    if (button.dataset.action === 'edit') loadDraft(product);
  });

  popularList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-load-id]');
    if (!button) return;
    const product = loadProducts().find((item) => item.id === button.dataset.loadId);
    if (product) loadDraft(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  search.addEventListener('input', refresh);
  sectionFilter.addEventListener('change', () => {
    selectedSectionFilter = sectionFilter.value;
    refresh();
  });
  newProduct.addEventListener('click', clearDraft);
  clearForm.addEventListener('click', clearDraft);
  resetFormState.addEventListener('click', clearDraft);
  refreshCatalog.addEventListener('click', refresh);
  resetDefaults.addEventListener('click', () => {
    if (!window.confirm('Reset all products to the default menu?')) return;
    resetProducts();
    clearDraft();
    refresh();
  });
  exportJson.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(loadProducts(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dew-products.json';
    link.click();
    URL.revokeObjectURL(url);
  });
  closeSession.addEventListener('click', () => {
    setAdminSessionUnlocked(false);
    clearIdleTimer();
    window.location.reload();
  });

  file.addEventListener('change', async () => {
    const selected = file.files && file.files[0];
    if (!selected) return;
    const reader = new FileReader();
    reader.onload = () => {
      draftImage = String(reader.result || '');
      image.value = draftImage;
      clearImage.checked = false;
      imagePreview.src = draftImage;
    };
    reader.readAsDataURL(selected);
  });

  image.addEventListener('input', () => {
    draftImage = image.value.trim();
    if (draftImage) {
      clearImage.checked = false;
      imagePreview.src = draftImage;
    }
  });

  clearImage.addEventListener('change', () => {
    if (clearImage.checked) {
      draftImage = '';
      image.value = '';
      imagePreview.src = `${PAGE_IMAGE_DIR}/page-44.jpg`;
    } else {
      const current = image.value.trim();
      imagePreview.src = current || `${PAGE_IMAGE_DIR}/page-44.jpg`;
    }
  });

  sectionJumpButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = app.querySelector(`#${button.dataset.jump}`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  refresh();
  clearDraft();
}
