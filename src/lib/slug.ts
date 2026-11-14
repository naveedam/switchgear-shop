// Keep in sync with api/seo.ts — server and client must build identical URLs.
export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/g, "");

/** Catalog names sometimes repeat the brand ("Havells Havells ..."); collapse consecutive duplicate words. */
export const cleanName = (n: string) => (n || "").replace(/\b([\w.-]+)(\s+\1\b)+/gi, "$1").replace(/\s+/g, " ").trim();

/** Canonical product slug: "<name-slug>-<uuid>". */
export const productSlug = (p: { id: string; name: string }) => {
  const s = slugify(cleanName(p.name));
  return `${s ? s + "-" : ""}${p.id}`;
};

export const productPath = (p: { id: string; name: string }) => `/products/${productSlug(p)}`;
export const brandPath = (brandName: string, categorySlug?: string) =>
  `/brands/${slugify(brandName)}${categorySlug ? `/${categorySlug}` : ""}`;
