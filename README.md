# SwitchgearShop.in

India's B2B marketplace for low-voltage switchgear: MCBs, MCCBs, ACBs, contactors, relays, cables and panel accessories.

**Live:** https://www.switchgearshop.in

## What it does

| For buyers | For sellers | For the platform |
|---|---|---|
| Upload a BOM (Excel/PDF) and get an **instant quote** priced across all sellers | List products, set **quantity breaks**, **account rates** and **dispatch times** | **Escrow**: buyer pays the platform, and sellers are settled after fulfilment |
| Raise RFQs for anything not in stock; compare quotes side by side | Respond to RFQs routed to them by category | Admin verifies **GSTINs** and **OEM dealer certificates** |
| Pay by **UPI / card / netbanking (Razorpay)** or bank transfer | GST invoices, **e-invoice (IRN) and e-way bill JSON** export | Commission invoicing, GSTR-1 export, settlement tracking |
| See **Authorised dealer**, **GST verified** and rating badges | **WhatsApp alerts** for new orders and RFQs | AI catalogue ingestion from price lists |

## Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind, shadcn/ui, React Router (routes code-split)
- **Backend:** Supabase (Postgres + RLS, Auth, Storage, Edge Functions on Deno)
- **Hosting:** Vercel. `api/seo.ts` server-renders product, category, brand and landing pages for search engines
- **Payments:** Razorpay Orders API + signature-verified webhook
- **Messaging:** WhatsApp Cloud API via a DB outbox
- **Monitoring:** Sentry (errors) and PostHog (funnels), both optional and env-gated

## Architecture rules

1. **Money is computed in the database, never in the browser.** `unit_price_for()` is the only pricing function; `place_order()` and `accept_quote_items()` are the only ways to create orders. Browsers cannot insert into `orders`, `seller_orders` or `order_items`.
2. **An order is paid only when Razorpay's signed webhook says so** (`mark_order_paid()`), and the amount must match to the paisa.
3. **Roles come from the database** (`companies.role`, `admin_users`). Triggers stop users editing their own role, status, verification flags, payment or settlement fields.
4. **Every edge function resolves the real caller** through `supabase/functions/_shared/guard.ts`. The gateway's `verify_jwt` accepts the public anon key, so it isn't enough on its own.

## Project layout

```
api/seo.ts                     Server-rendered SEO pages + sitemap (Vercel function)
src/pages/                     Routes (lazy-loaded); buyer/, seller/, admin/ sub-areas
src/components/                UI; trust/ (badges, ratings, WhatsApp), buyer/ (instant quote)
src/lib/                       razorpay.ts, monitoring.ts, slug.ts, gst/einvoice.ts
supabase/migrations/           Schema. 20261113* = security, pricing, trust
supabase/functions/            Edge functions; _shared/guard.ts = auth + rate limits
e2e/                           Playwright: public, SEO and security smoke tests
docs/                          Deployment and operations guides
```

## Local development

```bash
npm ci
cp .env.example .env      # fill in values
npm run dev               # http://localhost:8080
```

| Command | What it does |
|---|---|
| `npm run typecheck` | TypeScript (strict mode, null checks still off) |
| `npm test` | Unit tests (Vitest): GST e-invoice builder, URL slugs |
| `npm run test:e2e` | Playwright against `E2E_BASE_URL` (default: production) |
| `npm run build` | Production build |

## Configuration

**Vercel (browser):** see `.env.example`. Key ones: `VITE_RAZORPAY_ENABLED`, `VITE_ESCROW_*`, `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`, `VITE_PLATFORM_GSTIN`.

**Supabase secrets (server):** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `ALLOWED_ORIGIN`.

## Deploying changes

- **Frontend:** merge to `main` and Vercel deploys automatically.
- **Database:** add a new file in `supabase/migrations/`, test on a staging project, then run it in the Supabase SQL editor (or `supabase db push`). **Run the database step before merging code that depends on it.**
- **Edge functions:** deployed by Lovable on push, or `supabase functions deploy <name>`.

See [`docs/SECURITY_AND_PAYMENTS.md`](docs/SECURITY_AND_PAYMENTS.md) for Razorpay, WhatsApp and GST setup.

## CI

`.github/workflows/ci.yml` runs type check, unit tests and build on every pull request. After each push to `main` it waits for Vercel, then runs the Playwright smoke/SEO/security suite against production. Add the repository secret `SUPABASE_ANON_KEY` to enable the security checks.
