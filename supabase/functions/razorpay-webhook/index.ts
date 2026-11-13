// Razorpay webhook: the ONLY place an order becomes "paid".
// Configure in Razorpay Dashboard -> Webhooks with events payment.captured
// and order.paid, pointing at /functions/v1/razorpay-webhook.
import { adminClient } from "../_shared/guard.ts";

const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!WEBHOOK_SECRET) return new Response("Not configured", { status: 503 });

  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!safeEqual(await hmacHex(WEBHOOK_SECRET, raw), signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(raw);
  if (event.event !== "payment.captured" && event.event !== "order.paid") {
    return new Response("ignored", { status: 200 });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id || payment.currency !== "INR") {
    return new Response("ignored", { status: 200 });
  }

  const { error } = await adminClient().rpc("mark_order_paid", {
    p_razorpay_order_id: payment.order_id,
    p_razorpay_payment_id: payment.id,
    p_amount_paise: payment.amount,
  });
  if (error) {
    console.error("mark_order_paid failed", error);
    // 500 makes Razorpay retry; amount mismatches need a human, so log loudly.
    return new Response("error", { status: 500 });
  }
  return new Response("ok", { status: 200 });
});
