import { expect, test } from "@playwright/test";

// Calls the Supabase API directly, the way an attacker would, with only the public key.
const URL_ = process.env.E2E_SUPABASE_URL || "https://hdoefblcoavpzvfiiglm.supabase.co";
const KEY = process.env.E2E_SUPABASE_ANON_KEY || "";
const h = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

test.skip(!KEY, "set E2E_SUPABASE_ANON_KEY to run security checks");

test("anonymous users cannot create orders directly", async ({ request }) => {
  const res = await request.post(`${URL_}/rest/v1/orders`, { headers: h, data: { total_amount: 1 } });
  expect([401, 403]).toContain(res.status());
});

test("anonymous users cannot call place_order", async ({ request }) => {
  const res = await request.post(`${URL_}/rest/v1/rpc/place_order`, {
    headers: h, data: { p_items: [], p_shipping: {}, p_buyer: {} },
  });
  expect(res.ok()).toBeFalsy();
});

test("anonymous users cannot mark orders paid", async ({ request }) => {
  const res = await request.post(`${URL_}/rest/v1/rpc/mark_order_paid`, {
    headers: h, data: { p_razorpay_order_id: "x", p_razorpay_payment_id: "y", p_amount_paise: 1 },
  });
  expect(res.ok()).toBeFalsy();
});

for (const fn of ["generate-products", "extract-catalog", "parse-rfq-intake", "generate-category-images", "generate-bangalore-sellers"]) {
  test(`admin function ${fn} rejects the anon key`, async ({ request }) => {
    const res = await request.post(`${URL_}/functions/v1/${fn}`, { headers: h, data: {} });
    expect([401, 403]).toContain(res.status());
  });
}

test("parse-bom-document requires sign-in", async ({ request }) => {
  const res = await request.post(`${URL_}/functions/v1/parse-bom-document`, { headers: h, data: {} });
  expect(res.status()).toBe(401);
});

test("razorpay webhook rejects unsigned calls", async ({ request }) => {
  const res = await request.post(`${URL_}/functions/v1/razorpay-webhook`, {
    headers: { "Content-Type": "application/json", "x-razorpay-signature": "bad" },
    data: { event: "payment.captured" },
  });
  expect([401, 503]).toContain(res.status());
});

test("price tiers are public but not writable anonymously", async ({ request }) => {
  const read = await request.get(`${URL_}/rest/v1/product_price_tiers?limit=1`, { headers: h });
  expect(read.status()).toBe(200);
  const write = await request.post(`${URL_}/rest/v1/product_price_tiers`, {
    headers: h, data: { product_id: "00000000-0000-0000-0000-000000000000", min_qty: 2, unit_price: 1 },
  });
  expect(write.ok()).toBeFalsy();
});
