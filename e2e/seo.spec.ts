import { expect, test } from "@playwright/test";

// What search engines see: raw HTML from the server, before any JavaScript runs.

test("sitemap lists products, categories and brands", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  expect(xml).toContain("<urlset");
  expect(xml).toMatch(/\/products\/[a-z0-9-]+-[0-9a-f-]{36}</);
  expect(xml).toMatch(/\/brands\/[a-z0-9-]+</);
});

test("product pages are server-rendered with Product schema", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const url = xml.match(/<loc>([^<]*\/products\/[^<]+)<\/loc>/)?.[1];
  test.skip(!url, "no products in sitemap");
  const html = await (await request.get(new URL(url!).pathname)).text();
  expect(html).toMatch(/<title>[^<]+\| SwitchgearShop\.in<\/title>|<title>[^<]{20,}<\/title>/);
  expect(html).toContain('"@type":"Product"');
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(html).toMatch(/<link rel="canonical" href="https:\/\/www\.switchgearshop\.in\/products\//);
});

test("brand pages are server-rendered with an h1 and product links", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const url = xml.match(/<loc>([^<]*\/brands\/[a-z0-9-]+)<\/loc>/)?.[1];
  test.skip(!url, "no brands in sitemap");
  const html = await (await request.get(new URL(url!).pathname)).text();
  expect(html).toMatch(/<h1>[^<]*price list/i);
  expect(html).toContain('href="/products/');
});

test("unknown brand returns 404", async ({ request }) => {
  const res = await request.get("/brands/this-brand-does-not-exist-xyz");
  expect(res.status()).toBe(404);
});

test("robots.txt blocks private areas", async ({ request }) => {
  const txt = await (await request.get("/robots.txt")).text();
  for (const p of ["/admin", "/checkout", "/seller/"]) expect(txt).toContain(`Disallow: ${p}`);
});
