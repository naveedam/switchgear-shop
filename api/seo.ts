// Vercel serverless function: server-rendered SEO for product pages, category pages and the sitemap.
// Humans still get the normal React app: we inject real <title>, meta tags, JSON-LD and crawlable
// content into the same index.html, and React replaces the fallback content when it mounts.

const SITE = (process.env.SITE_URL || 'https://www.switchgearshop.in').replace(/\/$/, '');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hdoefblcoavpzvfiiglm.supabase.co';
// Public anon key (already shipped in the browser bundle). RLS decides what it can read.
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkb2VmYmxjb2F2cHp2ZmlpZ2xtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxODE5MTIsImV4cCI6MjA1MTc1NzkxMn0.hrQoy_OU4NtV-6Ho98meRF2kqfYvPsT3vlRskDrAM6Y';

const UUID_AT_END = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/g, '');
const SMALL = new Set(['and', 'of', 'for', 'the', 'to', 'in']);
const titleCase = (s: string) =>
  s.replace(/[-_]+/g, ' ').split(' ').map((w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
// Catalog names sometimes repeat the brand ("Havells Havells Industrial ..."); collapse consecutive duplicate words.
const cleanName = (n: string) => (n || '').replace(/\b([\w.-]+)(\s+\1\b)+/gi, '$1').replace(/\s+/g, ' ').trim();
const productPath = (p: { id: string; name: string }) => {
  const slug = slugify(cleanName(p.name));
  return `/products/${slug ? slug + '-' : ''}${p.id}`;
};

async function rest(path: string, params: Record<string, string>, extra: Record<string, string> = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}?${new URLSearchParams(params).toString()}`;
  const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, ...extra } });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r;
}

async function getTemplate(req: any): Promise<string> {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  try {
    const r = await fetch(`https://${host}/index.html`);
    if (r.ok) return await r.text();
  } catch { /* fall through */ }
  return `<!DOCTYPE html><html lang="en"><head></head><body><div id="root"></div></body></html>`;
}

interface PageMeta {
  title: string; description: string; canonical: string; image?: string;
  jsonLd?: object[]; body: string; noindex?: boolean; ogType?: string;
}

function render(tpl: string, m: PageMeta): string {
  const image = m.image || `${SITE}/og-switchgearshop.jpg`;
  let html = tpl
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+(?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[\s\S]*?\/>/gi, '');
  const head = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<link rel="canonical" href="${esc(m.canonical)}" />`,
    m.noindex ? `<meta name="robots" content="noindex" />` : '',
    `<meta property="og:type" content="${m.ogType || 'website'}" />`,
    `<meta property="og:site_name" content="SwitchgearShop.in" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${esc(m.canonical)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    ...(m.jsonLd || []).map(j => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ].join('\n    ');
  html = html.replace('</head>', `    ${head}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${m.body}</div>`);
  return html;
}

function send(res: any, status: number, html: string, cache = 'public, s-maxage=3600, stale-while-revalidate=86400') {
  res.status(status).setHeader('Content-Type', 'text/html; charset=utf-8').setHeader('Cache-Control', cache).send(html);
}

const notFound = async (req: any, res: any) =>
  send(res, 404, render(await getTemplate(req), {
    title: 'Page not found | SwitchgearShop.in', description: 'This page could not be found.',
    canonical: SITE, noindex: true, body: '',
  }), 'public, s-maxage=60');

// ---------- Product ----------
const PRODUCT_SELECT = 'id,name,sku,model_number,description,price,Images,category,hsn_code,tax_rate,series_name,' +
  'rated_current,pole_count,breaking_capacity,rated_voltage,rated_frequency,mounting_type,warranty_period,brands(name),' +
  'stock_quantity,lead_time_days,dispatch_city,companies(name)';
const PRODUCT_SELECT_FALLBACK = PRODUCT_SELECT.replace(',lead_time_days,dispatch_city', '');

async function productPage(req: any, res: any, rawSlug: string) {
  const m = rawSlug.match(UUID_AT_END);
  if (!m) return notFound(req, res);
  const id = m[1].toLowerCase();
  let p: any;
  try {
    const obj = { Accept: 'application/vnd.pgrst.object+json' };
    const r = await rest('products', { select: PRODUCT_SELECT, id: `eq.${id}`, status: 'eq.active' }, obj)
      .catch(() => rest('products', { select: PRODUCT_SELECT_FALLBACK, id: `eq.${id}`, status: 'eq.active' }, obj));
    p = await r.json();
  } catch { return notFound(req, res); }
  if (!p?.id) return notFound(req, res);

  const path = productPath(p);
  if (decodeURIComponent(`/products/${rawSlug}`) !== path) { // old UUID-only or stale slug -> 301
    res.status(301).setHeader('Location', path).setHeader('Cache-Control', 'public, s-maxage=86400').end();
    return;
  }

  let images: string[] = [];
  try { images = Array.isArray(p.Images) ? p.Images : typeof p.Images === 'string' ? JSON.parse(p.Images) : []; } catch { images = []; }
  images = images.filter(u => typeof u === 'string' && /^https?:\/\//.test(u));

  p.name = cleanName(p.name);
  const brand = p.brands?.name as string | undefined;
  const catName = p.category ? titleCase(p.category) : '';
  const catSlug = p.category ? String(p.category).replace(/_/g, '-') : '';
  const price = Number(p.price);
  const specs: [string, unknown][] = ([
    ['Brand', brand], ['Model number', p.model_number], ['SKU', p.sku], ['Series', p.series_name],
    ['Rated current', p.rated_current], ['Poles', p.pole_count ? `${p.pole_count}P` : null],
    ['Breaking capacity', p.breaking_capacity], ['Rated voltage', p.rated_voltage],
    ['Rated frequency', p.rated_frequency], ['Mounting', p.mounting_type], ['Warranty', p.warranty_period],
    ['HSN code', p.hsn_code], ['GST rate', p.tax_rate != null ? `${p.tax_rate}%` : null],
  ] as [string, unknown][]).filter(([, v]) => v != null && v !== '');

  const idBits = [brand, p.model_number || p.sku].filter(Boolean).join(' ');
  const baseTitle = `${p.name}${brand && !p.name.toLowerCase().includes(brand.toLowerCase()) ? ' – ' + brand : ''}`;
  const SUFFIX = ' | SwitchgearShop.in';
  const title = baseTitle.length + SUFFIX.length <= 70 ? baseTitle + SUFFIX : clip(baseTitle, 70);
  const descBase = (p.description && String(p.description).trim()) ||
    `${p.name}${idBits ? ` (${idBits})` : ''}${catName ? `, ${catName.toLowerCase()}` : ''}.`;
  const description = clip(`${descBase} Request a quote from verified sellers on SwitchgearShop.in, India's B2B switchgear marketplace.`, 158);
  const canonical = SITE + path;

  const inStock = p.stock_quantity == null || Number(p.stock_quantity) > 0;
  const offers = price > 0 ? {
    '@type': 'Offer', url: canonical, priceCurrency: 'INR', price: price.toFixed(2), itemCondition: 'https://schema.org/NewCondition',
    availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    priceValidUntil: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
    ...(p.companies?.name ? { seller: { '@type': 'Organization', name: p.companies.name } } : {}),
    ...(p.lead_time_days != null ? {
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: Number(p.lead_time_days), unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 7, unitCode: 'DAY' },
        },
      },
    } : {}),
  } : undefined;
  const jsonLd: object[] = [
    {
      '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: descBase,
      ...(images.length ? { image: images.slice(0, 4) } : {}),
      ...(p.sku ? { sku: p.sku } : {}), ...(p.model_number ? { mpn: p.model_number } : {}),
      ...(brand ? { brand: { '@type': 'Brand', name: brand } } : {}), ...(catName ? { category: catName } : {}),
      ...(offers ? { offers } : {}),
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
        ...(catSlug ? [{ '@type': 'ListItem', position: 2, name: catName, item: `${SITE}/categories/${catSlug}` }] : []),
        { '@type': 'ListItem', position: catSlug ? 3 : 2, name: p.name, item: canonical },
      ],
    },
  ];

  const body = `<main style="font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px">
<nav><a href="/">Home</a>${catSlug ? ` › <a href="/categories/${esc(catSlug)}">${esc(catName)}</a>` : ''}</nav>
<h1>${esc(p.name)}</h1>
${idBits ? `<p>${esc(idBits)}</p>` : ''}
${images[0] ? `<img src="${esc(images[0])}" alt="${esc(p.name)}" width="400" />` : ''}
${p.description ? `<p>${esc(p.description)}</p>` : ''}
${price > 0 ? `<p>Price: ₹${esc(price.toLocaleString('en-IN'))} (excl. GST)</p>` : '<p>Price on request.</p>'}
${brand ? `<p><a href="/brands/${esc(slugify(brand))}">All ${esc(brand)} products</a>${catSlug ? ` · <a href="/brands/${esc(slugify(brand))}/${esc(catSlug)}">${esc(brand)} ${esc(catName)}</a>` : ''}</p>` : ''}
${specs.length ? `<h2>Specifications</h2><table>${specs.map(([k, v]) => `<tr><th align="left">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>` : ''}
<p><a href="/products">Browse all switchgear</a> · <a href="/services">Skilled trades on demand</a></p>
</main>`;

  send(res, 200, render(await getTemplate(req), { title, description, canonical, image: images[0], jsonLd, body, ogType: 'product' }));
}

// ---------- Category ----------
async function categoryPage(req: any, res: any, slug: string) {
  const dbCat = slug.replace(/-/g, '_');
  let items: any[] = []; let total = 0;
  try {
    const r = await rest('products', {
      select: 'id,name,sku,model_number,price,brands(name)', category: `eq.${dbCat}`, status: 'eq.active',
      order: 'name.asc', limit: '60',
    }, { Prefer: 'count=exact' });
    items = await r.json();
    total = Number((r.headers.get('content-range') || '').split('/')[1]) || items.length;
  } catch { return notFound(req, res); }
  if (!items.length) return notFound(req, res);

  const name = titleCase(slug);
  const canonical = `${SITE}/categories/${slug}`;
  const title = clip(`${name} – Buy Online in India | SwitchgearShop.in`, 70);
  const brands = [...new Set(items.map(i => i.brands?.name).filter(Boolean))].slice(0, 6) as string[];
  const description = clip(
    `${total.toLocaleString('en-IN')} ${name.toLowerCase()} products${brands.length ? ` from ${brands.join(', ')} and more` : ''}. ` +
    `Compare specs and request quotes from verified sellers on SwitchgearShop.in.`, 158);

  const jsonLd: object[] = [
    {
      '@context': 'https://schema.org', '@type': 'CollectionPage', name, url: canonical,
      mainEntity: { '@type': 'ItemList', itemListElement: items.slice(0, 30).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + productPath(p), name: cleanName(p.name) })) },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name, item: canonical }],
    },
  ];
  const body = `<main style="font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px">
<nav><a href="/">Home</a> › <a href="/categories">Categories</a></nav>
<h1>${esc(name)}</h1>
<p>${total.toLocaleString('en-IN')} products. Request quotes from verified sellers.</p>
<ul>${items.map(p => `<li><a href="${esc(productPath(p))}">${esc(cleanName(p.name))}</a>${p.brands?.name ? ` – ${esc(p.brands.name)}` : ''}</li>`).join('')}</ul>
</main>`;
  send(res, 200, render(await getTemplate(req), { title, description, canonical, jsonLd, body }));
}

// ---------- Brand & brand×category (long-tail landing pages) ----------
async function findBrand(slug: string): Promise<any | null> {
  const r = await rest('brands', { select: 'id,name,description,website' });
  const all: any[] = await r.json();
  return all.find(b => slugify(b.name) === slug) || null;
}

async function brandPage(req: any, res: any, brandSlug: string, catSlug?: string) {
  const brand = await findBrand(brandSlug).catch(() => null);
  if (!brand) return notFound(req, res);
  const params: Record<string, string> = {
    select: 'id,name,model_number,price,category,rated_current,pole_count', brand_id: `eq.${brand.id}`, status: 'eq.active',
    order: 'name.asc', limit: '200',
  };
  if (catSlug) params.category = `eq.${catSlug.replace(/-/g, '_')}`;
  let items: any[] = []; let total = 0;
  try {
    const r = await rest('products', params, { Prefer: 'count=exact' });
    items = await r.json();
    total = Number((r.headers.get('content-range') || '').split('/')[1]) || items.length;
  } catch { return notFound(req, res); }
  if (!items.length) return notFound(req, res);

  const year = new Date().getFullYear();
  const catName = catSlug ? titleCase(catSlug) : '';
  const path = `/brands/${brandSlug}${catSlug ? '/' + catSlug : ''}`;
  const canonical = SITE + path;
  const prices = items.map(i => Number(i.price)).filter(n => n > 0);
  const range = prices.length ? `₹${Math.min(...prices).toLocaleString('en-IN')} – ₹${Math.max(...prices).toLocaleString('en-IN')}` : '';
  const baseT = catSlug ? `${brand.name} ${catName} Price List ${year}` : `${brand.name} Price List ${year} & Dealers`;
  const title = baseT.length + 19 <= 70 ? `${baseT} | SwitchgearShop.in` : clip(baseT, 70);
  const description = clip(`${total.toLocaleString('en-IN')} ${brand.name} ${catSlug ? catName.toLowerCase() : 'products'}` +
    `${range ? `, ${range}` : ''}. Live prices from verified dealers, GST invoice, fast dispatch across India.`, 158);

  const cats = catSlug ? [] : [...new Set(items.map(i => i.category).filter(Boolean))].map((c: string) => c.replace(/_/g, '-'));
  const crumbs = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Brands', item: SITE + '/brands' },
    { '@type': 'ListItem', position: 3, name: brand.name, item: `${SITE}/brands/${brandSlug}` },
    ...(catSlug ? [{ '@type': 'ListItem', position: 4, name: catName, item: canonical }] : []),
  ];
  const jsonLd: object[] = [
    {
      '@context': 'https://schema.org', '@type': 'CollectionPage', name: title.replace(/ \| .*$/, ''), url: canonical,
      about: { '@type': 'Brand', name: brand.name },
      mainEntity: { '@type': 'ItemList', numberOfItems: total,
        itemListElement: items.slice(0, 30).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + productPath(p), name: cleanName(p.name) })) },
    },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs },
  ];
  const body = `<main style="font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px">
<nav><a href="/">Home</a> › <a href="/brands">Brands</a> › ${catSlug ? `<a href="/brands/${esc(brandSlug)}">${esc(brand.name)}</a> › ${esc(catName)}` : esc(brand.name)}</nav>
<h1>${esc(brand.name)} ${catSlug ? esc(catName) : 'switchgear'} price list ${year}</h1>
<p>${esc(brand.description || `Genuine ${brand.name} products from verified dealers with GST invoice.`)}${range ? ` Prices ${esc(range)} (excl. GST).` : ''}</p>
${cats.length ? `<h2>Categories</h2><ul>${cats.map(c => `<li><a href="/brands/${esc(brandSlug)}/${esc(c)}">${esc(brand.name)} ${esc(titleCase(c))}</a></li>`).join('')}</ul>` : ''}
<table><tr><th align="left">Product</th><th align="left">Model</th><th align="right">Price</th></tr>
${items.map(p => `<tr><td><a href="${esc(productPath(p))}">${esc(cleanName(p.name))}</a></td><td>${esc(p.model_number || '')}</td><td align="right">${Number(p.price) > 0 ? '₹' + esc(Number(p.price).toLocaleString('en-IN')) : 'On request'}</td></tr>`).join('')}
</table>
<p><a href="/buyer/bom/upload">Upload your BOM for an instant quote</a></p>
</main>`;
  send(res, 200, render(await getTemplate(req), { title, description, canonical, jsonLd, body }));
}

// ---------- Static pages ----------
const STATIC_META: Record<string, { title: string; description: string; h1: string }> = {
  '/': {
    title: 'SwitchgearShop.in – B2B Switchgear Marketplace | MCB, MCCB, ACB Price List',
    description: "India's B2B marketplace for low-voltage switchgear. Upload your BOM for an instant quote, compare verified dealers, pay securely with escrow.",
    h1: 'B2B switchgear marketplace',
  },
  '/categories': { title: 'All Switchgear Categories | SwitchgearShop.in', description: 'Browse MCBs, MCCBs, ACBs, contactors, relays, cables and panel accessories from verified Indian dealers.', h1: 'All categories' },
  '/products': { title: 'Buy Switchgear Online – Live Dealer Prices | SwitchgearShop.in', description: 'Search thousands of switchgear products with live prices from verified dealers. GST invoice and escrow-protected payment.', h1: 'All products' },
  '/brands': { title: 'Switchgear Brands – Schneider, L&T, Siemens, ABB & more | SwitchgearShop.in', description: 'Price lists for every major switchgear brand in India, from authorised dealers.', h1: 'Brands' },
  '/sellers': { title: 'Verified Switchgear Dealers in India | SwitchgearShop.in', description: 'GST-verified and OEM-authorised switchgear dealers. Compare ratings and dispatch times.', h1: 'Sellers' },
  '/services': { title: 'Electricians, Panel Wiremen & Welders on Demand | SwitchgearShop.in', description: 'Book skilled trades for panel building, installation and maintenance.', h1: 'Services' },
  '/applications': { title: 'Switchgear by Application | SwitchgearShop.in', description: 'Products for panel building, power distribution, MCCs, energy management and industrial automation.', h1: 'Applications' },
  '/applications/panel-building': { title: 'Panel Building Components | SwitchgearShop.in', description: 'Busbars, enclosures, MCCBs, terminals and accessories for LT panel builders.', h1: 'Panel building' },
  '/applications/power-distribution': { title: 'Power Distribution Switchgear | SwitchgearShop.in', description: 'ACBs, MCCBs, changeovers and distribution boards for power distribution.', h1: 'Power distribution' },
  '/applications/motor-control-centers': { title: 'Motor Control Center (MCC) Components | SwitchgearShop.in', description: 'Contactors, overload relays, MPCBs and starters for MCC panels.', h1: 'Motor control centers' },
  '/applications/energy-management': { title: 'Energy Meters & Power Quality | SwitchgearShop.in', description: 'Multifunction meters, APFC relays, capacitors and harmonic filters.', h1: 'Energy management' },
  '/applications/industrial-automation': { title: 'Industrial Automation – PLC, VFD, HMI | SwitchgearShop.in', description: 'Drives, PLCs, HMIs and control gear for industrial automation.', h1: 'Industrial automation' },
  '/contact': { title: 'Contact SwitchgearShop.in', description: 'Talk to our team about bulk orders, dealer onboarding or support.', h1: 'Contact us' },
};

async function staticPage(req: any, res: any, path: string) {
  const meta = STATIC_META[path];
  if (!meta) return send(res, 200, await getTemplate(req), 'public, s-maxage=300');
  const canonical = SITE + (path === '/' ? '/' : path);
  const jsonLd: object[] = path === '/' ? [
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'SwitchgearShop.in', url: SITE + '/', logo: `${SITE}/favicon.ico` },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'SwitchgearShop.in', url: SITE + '/',
      potentialAction: { '@type': 'SearchAction', target: `${SITE}/products?search={search_term_string}`, 'query-input': 'required name=search_term_string' } },
  ] : [];
  let links = '';
  if (path === '/brands' || path === '/') {
    try {
      const r = await rest('brands', { select: 'name', order: 'name.asc', limit: '200' });
      const bs: any[] = await r.json();
      links = `<ul>${bs.map(b => `<li><a href="/brands/${esc(slugify(b.name))}">${esc(b.name)}</a></li>`).join('')}</ul>`;
    } catch { /* optional */ }
  }
  const body = `<main style="font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px">
<h1>${esc(meta.h1)}</h1><p>${esc(meta.description)}</p>${links}
<p><a href="/categories">Categories</a> · <a href="/brands">Brands</a> · <a href="/buyer/bom/upload">Instant BOM quote</a></p>
</main>`;
  send(res, 200, render(await getTemplate(req), { title: meta.title, description: meta.description, canonical, jsonLd, body }));
}

// ---------- Sitemap ----------
const STATIC_PATHS = ['/', '/categories', '/products', '/brands', '/sellers', '/services', '/services/request', '/services/join',
  '/contact', '/applications', '/applications/panel-building', '/applications/power-distribution',
  '/applications/motor-control-centers', '/applications/energy-management', '/applications/industrial-automation'];

async function sitemap(res: any) {
  const urls: { loc: string; lastmod?: string }[] = STATIC_PATHS.map(p => ({ loc: SITE + p }));
  const cats = new Set<string>();
  const brandCats = new Map<string, number>();
  for (let offset = 0, page = 0; page < 45; page++, offset += 1000) {
    const r = await rest('products', { select: 'id,name,category,updated_at,brands(name)', status: 'eq.active', order: 'id.asc', limit: '1000', offset: String(offset) });
    const rows: any[] = await r.json();
    for (const p of rows) {
      if (p.category) cats.add(String(p.category).replace(/_/g, '-'));
      if (p.brands?.name) {
        const b = slugify(p.brands.name);
        brandCats.set(b, (brandCats.get(b) || 0) + 1);
        if (p.category) {
          const k = `${b}/${String(p.category).replace(/_/g, '-')}`;
          brandCats.set(k, (brandCats.get(k) || 0) + 1);
        }
      }
      urls.push({ loc: SITE + productPath(p), lastmod: p.updated_at ? String(p.updated_at).slice(0, 10) : undefined });
    }
    if (rows.length < 1000) break;
  }
  for (const c of cats) urls.push({ loc: `${SITE}/categories/${c}` });
  // Brand pages, and brand×category pages with enough products to be useful (thin pages hurt rankings).
  for (const [k, n] of brandCats) if (!k.includes('/') || n >= 3) urls.push({ loc: `${SITE}/brands/${k}` });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n') + `\n</urlset>`;
  res.status(200).setHeader('Content-Type', 'application/xml; charset=utf-8')
    .setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=172800').send(xml);
}

export default async function handler(req: any, res: any) {
  try {
    const type = String(req.query.type || '');
    const slug = String(req.query.slug || '');
    if (type === 'sitemap') return await sitemap(res);
    if (type === 'product') return await productPage(req, res, slug);
    if (type === 'category') return await categoryPage(req, res, slug);
    if (type === 'brand') return await brandPage(req, res, slug, req.query.cat ? String(req.query.cat) : undefined);
    if (type === 'static') return await staticPage(req, res, String(req.query.path || '/'));
    return await notFound(req, res);
  } catch (e) {
    // Never break the site: fall back to the plain SPA shell.
    try { send(res, 200, await getTemplate(req), 'public, s-maxage=60'); } catch { res.status(500).end('error'); }
  }
}
