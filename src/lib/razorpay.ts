import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay?: any;
  }
}

let loader: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loader = null;
        reject(new Error("Could not load the payment window. Check your connection."));
      };
      document.body.appendChild(s);
    });
  }
  return loader;
}

export type PaymentOutcome = "paid" | "dismissed";

/**
 * Opens Razorpay Checkout for an order that already exists in the database.
 * "paid" means Razorpay reported success to the browser; the order is only
 * marked paid once the server-side webhook confirms the capture.
 */
export async function payOrderWithRazorpay(
  orderId: string,
  opts: { name?: string; description?: string } = {},
): Promise<PaymentOutcome> {
  const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
    body: { orderId },
  });
  if (error || !data?.razorpayOrderId) {
    throw new Error(data?.error || error?.message || "Could not start payment");
  }
  await loadCheckoutScript();

  return new Promise<PaymentOutcome>((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: data.keyId,
      order_id: data.razorpayOrderId,
      amount: data.amount,
      currency: data.currency,
      name: opts.name ?? "SwitchgearShop",
      description: opts.description ?? `Order ${orderId.slice(0, 8).toUpperCase()}`,
      prefill: data.prefill,
      notes: { order_id: orderId },
      theme: { color: "#1d4ed8" },
      handler: () => resolve("paid"),
      modal: { ondismiss: () => resolve("dismissed") },
    });
    rzp.on("payment.failed", (resp: { error?: { description?: string } }) => {
      reject(new Error(resp?.error?.description || "Payment failed"));
    });
    rzp.open();
  });
}
