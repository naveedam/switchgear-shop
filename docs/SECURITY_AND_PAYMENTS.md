# Security hardening, Razorpay, and conversion features: deploy guide

Branch: `hardening-and-conversion`

## What changed

### 1. Security
| Problem | Fix |
|---|---|
| Checkout sent prices/totals from the browser and inserted `orders` directly | `place_order()` SQL function prices every line from the DB (quantity breaks + account rates), checks stock / MOQ / product status, reserves stock, and splits by seller. Direct `INSERT` on `orders`, `seller_orders`, `order_items` is revoked for `anon`/`authenticated`. |
| RFQ quote acceptance built orders in the browser | `accept_quote_items()` verifies the buyer owns the RFQ and the quote items are live, then creates the order. |
| Buyers could update their own order's `payment_status`/`escrow_*`/`total_amount` | Trigger `guard_order_payment_fields` blocks it; only admins, the service role, and `mark_order_paid()` can. |
| Sellers could edit `settlement_*`, `platform_commission`, `subtotal` | Trigger `guard_seller_order_money_fields`. |
| Users could self-assign `companies.role = 'admin'`, set `status='active'`, or set `bank_verified` | Trigger `guard_company_privileged_fields`. Buyer → seller is allowed but forces `status='pending'`. Changing bank details or GSTIN clears verification. |
| 9 edge functions ran with full DB access and no user check (`ai-assistant`, `parse-bom-document`, `extract-pdf-text`, `route-rfq-sellers`, `extract-catalog`, `generate-products`, `generate-bangalore-sellers`, `generate-category-images`, `parse-rfq-intake`) | Shared `_shared/guard.ts`: resolves the real user, checks role, and rate-limits. Admin tools are now admin-only, buyer tools need sign-in, and `route-rfq-sellers` checks RFQ ownership. The AI assistant still works for guests, at 15 requests/hour per IP. |
| Hard-coded "emergency admin" email in `AdminRoleService` | Removed. Admin comes only from the DB. `user_metadata.role` (user-editable) can no longer grant admin in the UI. |
| `.env` committed | Untracked and git-ignored. (It only held the public anon key, but keep secrets out of the repo from now on.) |
| Placeholder bank account `123456789012` shown at checkout | Now read from `VITE_ESCROW_*` env vars. Bank transfer is hidden if unset. |

### 2. Conversion
- **Instant BOM quote**: after a BOM upload, `instant_bom_quote()` prices every line against all live sellers (exact model match first, then full-text). The buyer can add every buyable line to the cart in one click, with the rest going to RFQ.
- **B2B pricing**: `product_price_tiers` (quantity breaks) and `buyer_seller_rates` (per-account % discount). `unit_price_for()` is the single pricing function, used by the cart, checkout, product page and instant quote.
- **Delivery promise**: `products.lead_time_days` and `dispatch_city`, shown on product pages and in quotes. Instant quotes prefer in-stock, faster offers.
- **Trust**: "Authorised {brand} dealer" (OEM certificate verified by admin), "GST verified", star rating and on-time %. The `seller_trust` view feeds the badges, and buyers can rate a seller once the order is delivered.
- **WhatsApp alerts**: DB triggers queue messages in `notification_outbox` (new order → seller; status change → buyer; quote submitted → buyer). `whatsapp-dispatch` sends them via the Meta Cloud API. Opt-in is per user.
- **Razorpay**: checkout defaults to online payment (UPI/cards/netbanking) and keeps bank transfer as an option. An order becomes paid **only** via the signature-verified webhook, which also checks the amount matches.

New screens: `/seller/pricing` (Pricing & Trust), `/admin/trust` (Seller Trust), a WhatsApp card on `/profile`, **Pay now** on `/orders`, and **Rate seller** on delivered shipments.

## Deploy steps (in order)

### 1. Back up and apply migrations
```bash
supabase db dump -f backup-before-hardening.sql
supabase db push        # applies the three 20261113* migrations
```
These migrations were tested on PostgreSQL 16 against a reproduction of the relevant tables.
The repo's migrations don't contain the full base schema (Lovable created it), so **apply on a staging copy first**.

### 2. Secrets for edge functions
```bash
supabase secrets set \
  RAZORPAY_KEY_ID=rzp_live_xxx RAZORPAY_KEY_SECRET=xxx RAZORPAY_WEBHOOK_SECRET=<random 32+ chars> \
  WHATSAPP_TOKEN=<permanent system-user token> WHATSAPP_PHONE_NUMBER_ID=<id> WHATSAPP_TEMPLATE_LANG=en \
  ALLOWED_ORIGIN=https://www.switchgearshop.in
supabase functions deploy
```
Use `rzp_test_...` keys on staging first.

### 3. Razorpay webhook
Razorpay Dashboard → Settings → Webhooks → Add:
- URL: `https://<project-ref>.supabase.co/functions/v1/razorpay-webhook`
- Secret: same as `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured`, `order.paid`

### 4. WhatsApp templates (Meta Business Manager)
Create these **Utility** templates (body parameters in order):

| Template | Body (suggested) |
|---|---|
| `new_order_seller` | New order #{{1}} worth ₹{{2}} on SwitchgearShop. Please accept it within 4 hours from your seller dashboard. |
| `order_status_buyer` | Your SwitchgearShop order #{{1}} is now *{{2}}*. Tracking: {{3}} |
| `new_quote_buyer` | You have a new quote on {{1}} for ₹{{2}}. Compare quotes in your SwitchgearShop dashboard. |

Schedule the sender (enable the `pg_cron` and `pg_net` extensions first):
```sql
select cron.schedule('whatsapp-dispatch', '* * * * *', $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/whatsapp-dispatch',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>')
  );
$$);
```

### 5. Vercel env vars
```
VITE_RAZORPAY_ENABLED=true
VITE_ESCROW_BANK_NAME=...        VITE_ESCROW_ACCOUNT_NAME=...
VITE_ESCROW_ACCOUNT_NUMBER=...   VITE_ESCROW_IFSC=...
```

### 6. Smoke test on staging
1. As a buyer, add items and check out with Razorpay test card `4111 1111 1111 1111`. The order should show **completed** within seconds, and `escrow_transactions` should have a row.
2. Edit the cart price in DevTools and check out. The order total must still equal the DB price.
3. Run `supabase.from('orders').insert({...})` from the browser console. It should fail with *permission denied*.
4. Run `supabase.from('companies').update({role:'admin'}).eq('id', me)`. It should fail.
5. Call `supabase.functions.invoke('generate-products')` as a buyer. It should return 403.
6. Upload a BOM. You should see the instant quote, and **Add N items to cart** should work.
7. As a seller, go to Pricing & Trust: add a quantity break and upload a dealer certificate. As an admin, approve it at `/admin/trust`, then check that the badge shows on the product page.

## Behaviour changes to know about
- **Stock is reserved at order time** for products that track `stock_quantity` (NULL means made to order and isn't tracked). Cancelling an order doesn't release stock yet.
- Products with `price` NULL/0 can't be bought through the cart. Buyers are told to raise an RFQ.
- `seller_orders.tax_amount` is still 0 at checkout (unchanged; sellers add GST on their invoice). Decide whether list prices are GST-inclusive and say so on the product page. It currently shows "+ GST".
- New sellers (or buyers switching to seller) start as `status='pending'` until an admin activates them.
- Existing `seller_brand_authorizations` rows with `status='active'` are treated as verified. Their `seller_id` must be the seller's `companies.id` for the badge to show.
