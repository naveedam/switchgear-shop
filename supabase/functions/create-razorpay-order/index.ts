// Creates a Razorpay order for an existing SwitchgearShop order.
// The amount is read from the database — never from the browser.
import { adminClient, corsHeaders, errorResponse, HttpError, json, rateLimit, requireUser } from "../_shared/guard.ts";

const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!KEY_ID || !KEY_SECRET) throw new HttpError(503, "Online payments are not configured");
    const { user } = await requireUser(req);
    await rateLimit(`rzp-order:${user.id}`, 20, 3600);

    const { orderId } = await req.json();
    if (!orderId) throw new HttpError(400, "orderId is required");

    const db = adminClient();
    const { data: order } = await db
      .from("orders")
      .select("id, buyer_id, total_amount, payment_status, razorpay_order_id, buyer_email, buyer_phone")
      .eq("id", orderId)
      .maybeSingle();

    if (!order || order.buyer_id !== user.id) throw new HttpError(404, "Order not found");
    if (order.payment_status === "completed") throw new HttpError(409, "Order is already paid");

    const amountPaise = Math.round(Number(order.total_amount) * 100);
    let rzpOrderId = order.razorpay_order_id as string | null;

    if (!rzpOrderId) {
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${KEY_ID}:${KEY_SECRET}`),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: order.id.slice(0, 40),
          notes: { order_id: order.id },
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        console.error("razorpay order error", body);
        throw new HttpError(502, "Could not start payment, please try again");
      }
      rzpOrderId = body.id;
      await db.from("orders")
        .update({ razorpay_order_id: rzpOrderId, payment_method: "razorpay" })
        .eq("id", order.id);
    }

    return json({
      keyId: KEY_ID,
      razorpayOrderId: rzpOrderId,
      amount: amountPaise,
      currency: "INR",
      prefill: { email: order.buyer_email ?? user.email, contact: order.buyer_phone ?? "" },
    });
  } catch (e) {
    return errorResponse(e);
  }
});
