import { ADMIN_CONFIG } from './config/admin.config.js';
import { seedProducts } from './products-data.js';

const STORAGE_KEY = 'dew.products.v1';
const ADMIN_SESSION_KEY = 'dew.admin.unlocked.v1';
const ADMIN_CODEBOOK_KEY = 'dew.admin.codebook.v1';
const BRANDING_KEY = 'dew.branding.v1';
const PRODUCT_IMAGE_DIR = './assets/images/products';
const PAGE_IMAGE_DIR = './assets/images/pages';
const IDLE_LOGOUT_TIMER_KEY = 'dew.admin.idle.timer.v1';
const ASSET_VERSION = '__DEW_ASSET_VERSION__';

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
    image: versionAssetPath(`${PRODUCT_IMAGE_DIR}/cold-iced-coffee.jpg`),
    order: 999,
  },
];

const DEFAULT_POPULAR_NAMES = ['Donut', 'Croissant', 'Iced Coffee'];

const DEFAULT_BRANDING = {
  logoText: 'DEW',
  brandName: 'DEW Coffee',
  brandSub: 'Coffee & More',
  logoImage: '',
  heroImage: '',
  heroTitle: 'DEW',
  heroCopy: '',
  ribbon: '',
  kicker: '',
  addressLines: ['النجف الأشرف', 'حي الأمير', 'شارع كلية التربية للبنات'],
};

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function versionAssetPath(value) {
  const url = String(value ?? '');
  if (!url) return url;
  if (/^(data:|blob:|https?:|javascript:)/i.test(url)) return url;
  const [base, hash = ''] = url.split('#');
  if (/[?&]v=/.test(base)) return hash ? `${base}#${hash}` : base;
  const joiner = base.includes('?') ? '&' : '?';
  const versioned = `${base}${joiner}v=${ASSET_VERSION}`;
  return hash ? `${versioned}#${hash}` : versioned;
}

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

function seedAdminCodebook() {
  const seeds = Array.isArray(ADMIN_CONFIG.accessCodeHashes) && ADMIN_CONFIG.accessCodeHashes.length
    ? ADMIN_CONFIG.accessCodeHashes
    : [ADMIN_CONFIG.passwordHash];
  const unique = [];
  for (const hash of seeds) {
    if (typeof hash !== 'string' || !hash) continue;
    if (unique.some((entry) => entry.hash === hash)) continue;
    unique.push({
      label: unique.length === 0 ? 'Primary' : `Extra ${unique.length}`,
      hash,
      createdAt: Date.now() + unique.length,
    });
  }
  return unique;
}

function normalizeAdminCodebook(entries) {
  const normalized = [];
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || typeof entry !== 'object') continue;
    const hash = String(entry.hash || '').trim();
    if (!hash || normalized.some((item) => item.hash === hash)) continue;
    normalized.push({
      label: String(entry.label || '').trim() || `Code ${normalized.length + 1}`,
      hash,
      createdAt: Number.isFinite(entry.createdAt) ? entry.createdAt : Date.now(),
    });
  }
  return normalized.length ? normalized : seedAdminCodebook();
}

function loadAdminCodebook() {
  if (typeof window === 'undefined') return seedAdminCodebook();
  try {
    const raw = window.localStorage.getItem(ADMIN_CODEBOOK_KEY);
    if (!raw) {
      const fresh = seedAdminCodebook();
      window.localStorage.setItem(ADMIN_CODEBOOK_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return normalizeAdminCodebook(JSON.parse(raw));
  } catch {
    return seedAdminCodebook();
  }
}

function saveAdminCodebook(entries) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ADMIN_CODEBOOK_KEY, JSON.stringify(normalizeAdminCodebook(entries)));
}

function addAdminCode(code, label = '') {
  const value = String(code || '').trim();
  if (!value) return false;
  const hash = sha256HexSync(`${ADMIN_CONFIG.salt}:${value}`);
  const codebook = loadAdminCodebook();
  if (codebook.some((entry) => entry.hash === hash)) return false;
  codebook.unshift({
    label: String(label || '').trim() || `Code ${codebook.length + 1}`,
    hash,
    createdAt: Date.now(),
  });
  saveAdminCodebook(codebook);
  return true;
}

function removeAdminCode(hash) {
  const codebook = loadAdminCodebook().filter((entry) => entry.hash !== hash);
  saveAdminCodebook(codebook);
  return codebook;
}

function normalizeBranding(value) {
  const source = value && typeof value === 'object' ? value : {};
  const lines = Array.isArray(source.addressLines) ? source.addressLines : DEFAULT_BRANDING.addressLines;
  return {
    logoText: String(source.logoText || DEFAULT_BRANDING.logoText).trim(),
    brandName: String(source.brandName || DEFAULT_BRANDING.brandName).trim(),
    brandSub: String(source.brandSub || DEFAULT_BRANDING.brandSub).trim(),
    logoImage: String(source.logoImage || '').trim(),
    heroImage: String(source.heroImage || '').trim(),
    heroTitle: String(source.heroTitle || DEFAULT_BRANDING.heroTitle).trim(),
    heroCopy: String(source.heroCopy || '').trim(),
    ribbon: String(source.ribbon || '').trim(),
    kicker: String(source.kicker || '').trim(),
    addressLines: lines.map((line) => String(line || '').trim()).filter(Boolean).slice(0, 3),
  };
}

function loadBranding() {
  if (typeof window === 'undefined') return normalizeBranding(DEFAULT_BRANDING);
  try {
    const raw = window.localStorage.getItem(BRANDING_KEY);
    if (!raw) {
      const fresh = normalizeBranding(DEFAULT_BRANDING);
      window.localStorage.setItem(BRANDING_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return normalizeBranding(JSON.parse(raw));
  } catch {
    return normalizeBranding(DEFAULT_BRANDING);
  }
}

function saveBranding(branding) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BRANDING_KEY, JSON.stringify(normalizeBranding(branding)));
}

function resetBranding() {
  const fresh = normalizeBranding(DEFAULT_BRANDING);
  saveBranding(fresh);
  return fresh;
}

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sha256HexSync(input) {
  const bytes = new TextEncoder().encode(String(input));
  const words = [];
  for (let i = 0; i < bytes.length; i += 1) {
    words[i >> 2] |= bytes[i] << (24 - (i % 4) * 8);
  }
  words[bytes.length >> 2] |= 0x80 << (24 - (bytes.length % 4) * 8);
  words[((bytes.length + 8 >> 6) << 4) + 15] = bytes.length * 8;

  let a = 0x6a09e667;
  let b = 0xbb67ae85;
  let c = 0x3c6ef372;
  let d = 0xa54ff53a;
  let e = 0x510e527f;
  let f = 0x9b05688c;
  let g = 0x1f83d9ab;
  let h = 0x5be0cd19;

  const w = new Array(64);

  for (let i = 0; i < words.length; i += 16) {
    let aa = a;
    let bb = b;
    let cc = c;
    let dd = d;
    let ee = e;
    let ff = f;
    let gg = g;
    let hh = h;

    for (let j = 0; j < 64; j += 1) {
      if (j < 16) {
        w[j] = words[i + j] | 0;
      } else {
        const s0 = ((w[j - 15] >>> 7) | (w[j - 15] << 25)) ^ ((w[j - 15] >>> 18) | (w[j - 15] << 14)) ^ (w[j - 15] >>> 3);
        const s1 = ((w[j - 2] >>> 17) | (w[j - 2] << 15)) ^ ((w[j - 2] >>> 19) | (w[j - 2] << 13)) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const s1 = ((ee >>> 6) | (ee << 26)) ^ ((ee >>> 11) | (ee << 21)) ^ ((ee >>> 25) | (ee << 7));
      const ch = (ee & ff) ^ (~ee & gg);
      const temp1 = (hh + s1 + ch + SHA256_K[j] + w[j]) | 0;
      const s0 = ((aa >>> 2) | (aa << 30)) ^ ((aa >>> 13) | (aa << 19)) ^ ((aa >>> 22) | (aa << 10));
      const maj = (aa & bb) ^ (aa & cc) ^ (bb & cc);
      const temp2 = (s0 + maj) | 0;

      hh = gg;
      gg = ff;
      ff = ee;
      ee = (dd + temp1) | 0;
      dd = cc;
      cc = bb;
      bb = aa;
      aa = (temp1 + temp2) | 0;
    }

    a = (a + aa) | 0;
    b = (b + bb) | 0;
    c = (c + cc) | 0;
    d = (d + dd) | 0;
    e = (e + ee) | 0;
    f = (f + ff) | 0;
    g = (g + gg) | 0;
    h = (h + hh) | 0;
  }

  return [a, b, c, d, e, f, g, h]
    .map((value) => (value >>> 0).toString(16).padStart(8, '0'))
    .join('');
}

async function sha256Hex(input) {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    const bytes = new TextEncoder().encode(String(input));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return sha256HexSync(input);
}

async function hashPassword(value) {
  return sha256Hex(`${ADMIN_CONFIG.salt}:${value}`);
}

async function verifyAdminPassword(value) {
  const hash = await hashPassword(value);
  return loadAdminCodebook().some((entry) => entry.hash === hash);
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
  const deduped = new Map();
  products.forEach((product, index) => {
    const section = product.section || 'hot';
    const next = (counters.get(section) || 0) + 1;
    counters.set(section, next);
    const normalized = {
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
    deduped.set(normalized.id, normalized);
  });
  return Array.from(deduped.values());
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

function remoteImageForProduct(product) {
  return versionAssetPath(`${PRODUCT_IMAGE_DIR}/${product.id}.jpg`);
}

function mediaForProduct(product, index) {
  if (product.custom && product.image) return { src: versionAssetPath(product.image), focus: '50% 45%' };
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
        src: remoteImageForProduct(product),
        focus: `${x.toFixed(1)}% ${y.toFixed(1)}%`,
        fallback: versionAssetPath(product.image || `${PAGE_IMAGE_DIR}/page-${String(group.page).padStart(2, '0')}.jpg`),
      };
    }
    offset -= group.count;
  }
  const fallback = groups[groups.length - 1] || { page: 44 };
  return {
    src: remoteImageForProduct(product),
    focus: '50% 50%',
    fallback: versionAssetPath(product.image || `${PAGE_IMAGE_DIR}/page-${String(fallback.page).padStart(2, '0')}.jpg`),
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
  const branding = loadBranding();
  const logo = branding.logoImage
    ? `<img class="brand-logo-image" src="${esc(versionAssetPath(branding.logoImage))}" alt="${esc(branding.brandName)}">`
    : `<div class="brand-mark">${esc(branding.logoText || DEFAULT_BRANDING.logoText)}</div>`;
  return `
    <header class="site-header">
      <div class="brand">
        ${logo}
        <div>
          <div class="brand-name">${esc(branding.brandName || DEFAULT_BRANDING.brandName)}</div>
          ${branding.brandSub ? `<div class="brand-sub">${esc(branding.brandSub)}</div>` : ''}
        </div>
      </div>
      ${branding.ribbon ? `<div class="brand-ribbon">${esc(branding.ribbon)}</div>` : ''}
    </header>
  `;
}

function buildHero(products) {
  const branding = loadBranding();
  const total = products.length;
  const sections = getSections().length;
  const popularCount = popularProducts(products).length;
  const addressLines = branding.addressLines.length ? branding.addressLines : DEFAULT_BRANDING.addressLines;
  const heroImage = branding.heroImage ? `<div class="hero-image"><img src="${esc(versionAssetPath(branding.heroImage))}" alt="${esc(branding.brandName || branding.heroTitle)}" loading="lazy" decoding="async"></div>` : '';
  return `
    <section class="hero">
      ${branding.kicker ? `<div class="hero-kicker">${esc(branding.kicker)}</div>` : ''}
      ${heroImage}
      <h1 class="hero-title">${esc(branding.heroTitle || branding.brandName || DEFAULT_BRANDING.heroTitle)}</h1>
      <div class="hero-address">
        ${addressLines.map((line) => `<span>${esc(line)}</span>`).join('')}
      </div>
      ${branding.heroCopy ? `<p class="hero-copy">${esc(branding.heroCopy)}</p>` : ''}
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
  if (typeof document !== 'undefined') {
    const branding = loadBranding();
    document.title = branding.brandName || 'DEW Coffee';
  }
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
      if (event.key !== STORAGE_KEY && event.key !== BRANDING_KEY) return;
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
          <img src="${esc(mediaForProduct(product, 0).src)}" alt="${esc(product.nameEn || product.nameAr)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${versionAssetPath(`${PAGE_IMAGE_DIR}/page-44.jpg`)}'">
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
          <button type="button" class="admin-chip" data-jump="editor">Add / Edit</button>
          <button type="button" class="admin-chip" data-jump="catalog">Catalog</button>
          <button type="button" class="admin-chip" data-jump="popular">Most Popular</button>
          <button type="button" class="admin-chip" data-jump="settings">Settings</button>
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
                <img id="imagePreview" alt="Preview" src="${versionAssetPath(`${PAGE_IMAGE_DIR}/page-44.jpg`)}">
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

            <div class="card panel branding-panel" id="branding">
              <div class="panel-head">
                <div>
                  <h3>Branding</h3>
                  <p>Edit logo, name, hero text, and address lines.</p>
                </div>
                <div class="editor-id" id="brandingState">Brand defaults</div>
              </div>
              <div class="preview-shell">
                <div class="preview-frame">
                  <img id="brandingPreview" alt="Brand preview" src="${versionAssetPath(`${PAGE_IMAGE_DIR}/page-44.jpg`)}">
                </div>
                <div class="preview-meta">
                  <strong>Brand preview</strong>
                  <span>Use a file upload or paste an image URL for the logo or hero image.</span>
                </div>
              </div>
              <label>
                Logo text
                <input id="brandLogoText" type="text" placeholder="DEW">
              </label>
              <label>
                Site name
                <input id="brandName" type="text" placeholder="DEW Coffee">
              </label>
              <label>
                Site subtitle
                <input id="brandSub" type="text" placeholder="Coffee & More">
              </label>
              <label>
                Hero title
                <input id="heroTitle" type="text" placeholder="DEW">
              </label>
              <label>
                Hero text
                <input id="heroCopy" type="text" placeholder="">
              </label>
              <label>
                Top ribbon
                <input id="brandRibbon" type="text" placeholder="">
              </label>
              <label>
                Hero kicker
                <input id="brandKicker" type="text" placeholder="">
              </label>
              <label>
                Address line 1
                <input id="address1" type="text" placeholder="النجف الأشرف">
              </label>
              <label>
                Address line 2
                <input id="address2" type="text" placeholder="حي الأمير">
              </label>
              <label>
                Address line 3
                <input id="address3" type="text" placeholder="شارع كلية التربية للبنات">
              </label>
              <label>
                Logo image URL
                <input id="brandLogoImage" type="text" placeholder="Paste image URL or upload below">
              </label>
              <label>
                Upload logo image
                <input id="brandLogoFile" type="file" accept="image/*">
              </label>
              <label>
                Hero image URL
                <input id="brandHeroImage" type="text" placeholder="Paste image URL or upload below">
              </label>
              <label>
                Upload hero image
                <input id="brandHeroFile" type="file" accept="image/*">
              </label>
              <div class="form-actions">
                <button type="button" class="primary-btn" id="saveBranding">Save Branding</button>
                <button type="button" class="ghost-btn" id="resetBranding">Reset Branding</button>
              </div>
            </div>

            <div class="card panel codes-panel" id="codes">
              <div class="panel-head">
                <div>
                  <h3>Access Codes</h3>
                  <p>Primary code plus any extra codes you want to add.</p>
                </div>
                <div class="editor-id" id="codesState">2 active codes</div>
              </div>
              <div class="code-form">
                <label>
                  Code label
                  <input id="newCodeLabel" type="text" placeholder="Backup code">
                </label>
                <label>
                  New access code
                  <input id="newCodeValue" type="password" placeholder="Type a new code">
                </label>
                <div class="form-actions">
                  <button type="button" class="primary-btn" id="addAccessCode">Add Code</button>
                </div>
              </div>
              <div id="codeList" class="code-list"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function renderAdmin(root) {
  installSecurityGuards();
  if (typeof document !== 'undefined') {
    document.title = 'DEW Admin';
  }
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
  const brandingPreview = app.querySelector('#brandingPreview');
  const brandingState = app.querySelector('#brandingState');
  const brandLogoText = app.querySelector('#brandLogoText');
  const brandName = app.querySelector('#brandName');
  const brandSub = app.querySelector('#brandSub');
  const heroTitle = app.querySelector('#heroTitle');
  const heroCopy = app.querySelector('#heroCopy');
  const brandRibbon = app.querySelector('#brandRibbon');
  const brandKicker = app.querySelector('#brandKicker');
  const address1 = app.querySelector('#address1');
  const address2 = app.querySelector('#address2');
  const address3 = app.querySelector('#address3');
  const brandLogoImage = app.querySelector('#brandLogoImage');
  const brandLogoFile = app.querySelector('#brandLogoFile');
  const brandHeroImage = app.querySelector('#brandHeroImage');
  const brandHeroFile = app.querySelector('#brandHeroFile');
  const saveBrandingButton = app.querySelector('#saveBranding');
  const resetBrandingButton = app.querySelector('#resetBranding');
  const newCodeLabel = app.querySelector('#newCodeLabel');
  const newCodeValue = app.querySelector('#newCodeValue');
  const addAccessCodeButton = app.querySelector('#addAccessCode');
  const codeList = app.querySelector('#codeList');
  const codesState = app.querySelector('#codesState');
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
  let branding = loadBranding();
  let codebook = loadAdminCodebook();
  let draftImage = '';
  let selectedSectionFilter = '';

  brandLogoText.value = branding.logoText || '';
  brandName.value = branding.brandName || '';
  brandSub.value = branding.brandSub || '';
  heroTitle.value = branding.heroTitle || '';
  heroCopy.value = branding.heroCopy || '';
  brandRibbon.value = branding.ribbon || '';
  brandKicker.value = branding.kicker || '';
  address1.value = branding.addressLines[0] || '';
  address2.value = branding.addressLines[1] || '';
  address3.value = branding.addressLines[2] || '';
  brandLogoImage.value = branding.logoImage || '';
  brandHeroImage.value = branding.heroImage || '';
  renderBrandingState();

  function refresh() {
    products = loadProducts();
    branding = loadBranding();
    codebook = loadAdminCodebook();
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
    renderBrandingState();
    renderCodebook();
  }

  function renderBrandingState() {
    if (!brandingState) return;
    brandingState.textContent = branding.brandName || branding.heroTitle || 'Brand defaults';
    if (brandingPreview) {
      const previewSource = branding.heroImage || branding.logoImage || `${PAGE_IMAGE_DIR}/page-44.jpg`;
      brandingPreview.src = versionAssetPath(previewSource);
    }
  }

  function renderCodebook() {
    if (!codeList || !codesState) return;
    codesState.textContent = `${codebook.length} active code${codebook.length === 1 ? '' : 's'}`;
    codeList.innerHTML = codebook
      .map(
        (entry, index) => `
          <div class="code-item">
            <div>
              <strong>${esc(entry.label || `Code ${index + 1}`)}</strong>
              <small>${esc(entry.hash.slice(0, 12))}…</small>
            </div>
            <button type="button" class="ghost-btn danger" data-code-hash="${esc(entry.hash)}">Remove</button>
          </div>
        `
      )
      .join('');
  }

  function syncBrandForm() {
    brandLogoText.value = branding.logoText || '';
    brandName.value = branding.brandName || '';
    brandSub.value = branding.brandSub || '';
    heroTitle.value = branding.heroTitle || '';
    heroCopy.value = branding.heroCopy || '';
    brandRibbon.value = branding.ribbon || '';
    brandKicker.value = branding.kicker || '';
    address1.value = branding.addressLines[0] || '';
    address2.value = branding.addressLines[1] || '';
    address3.value = branding.addressLines[2] || '';
    brandLogoImage.value = branding.logoImage || '';
    brandHeroImage.value = branding.heroImage || '';
    renderBrandingState();
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
    imagePreview.src = versionAssetPath(`${PAGE_IMAGE_DIR}/page-44.jpg`);
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
    imagePreview.src = mediaForProduct(product, 0).src || versionAssetPath(`${PAGE_IMAGE_DIR}/page-44.jpg`);
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

  saveBrandingButton.addEventListener('click', () => {
    branding = normalizeBranding({
      logoText: brandLogoText.value,
      brandName: brandName.value,
      brandSub: brandSub.value,
      logoImage: brandLogoImage.value,
      heroImage: brandHeroImage.value,
      heroTitle: heroTitle.value,
      heroCopy: heroCopy.value,
      ribbon: brandRibbon.value,
      kicker: brandKicker.value,
      addressLines: [address1.value, address2.value, address3.value],
    });
    saveBranding(branding);
    renderBrandingState();
  });

  resetBrandingButton.addEventListener('click', () => {
    branding = resetBranding();
    syncBrandForm();
  });

  addAccessCodeButton.addEventListener('click', () => {
    if (addAdminCode(newCodeValue.value, newCodeLabel.value)) {
      codebook = loadAdminCodebook();
      newCodeValue.value = '';
      newCodeLabel.value = '';
      renderCodebook();
    }
  });

  codeList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-code-hash]');
    if (!button) return;
    if (codebook.length <= 1) return;
    removeAdminCode(button.dataset.codeHash);
    codebook = loadAdminCodebook();
    renderCodebook();
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

  brandLogoFile.addEventListener('change', async () => {
    const selected = brandLogoFile.files && brandLogoFile.files[0];
    if (!selected) return;
    const reader = new FileReader();
    reader.onload = () => {
      brandLogoImage.value = String(reader.result || '');
      brandingPreview.src = brandLogoImage.value || versionAssetPath(`${PAGE_IMAGE_DIR}/page-44.jpg`);
    };
    reader.readAsDataURL(selected);
  });

  brandHeroFile.addEventListener('change', async () => {
    const selected = brandHeroFile.files && brandHeroFile.files[0];
    if (!selected) return;
    const reader = new FileReader();
    reader.onload = () => {
      brandHeroImage.value = String(reader.result || '');
      brandingPreview.src = brandHeroImage.value || versionAssetPath(`${PAGE_IMAGE_DIR}/page-44.jpg`);
    };
    reader.readAsDataURL(selected);
  });

  clearImage.addEventListener('change', () => {
    if (clearImage.checked) {
      draftImage = '';
      image.value = '';
      imagePreview.src = versionAssetPath(`${PAGE_IMAGE_DIR}/page-44.jpg`);
    } else {
      const current = image.value.trim();
      imagePreview.src = current ? versionAssetPath(current) : versionAssetPath(`${PAGE_IMAGE_DIR}/page-44.jpg`);
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
