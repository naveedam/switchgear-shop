
import React, { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const BANK_ACCOUNT = {
  accountNumber: "123456789012",
  ifsc: "SBIN0000123",
  bankName: "State Bank of India",
  accountName: "SwitchgearShop Pvt Ltd",
};

const initialAddress = { street: "", city: "", state: "", zipCode: "", country: "" };

const CheckoutPage: React.FC = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState<"address" | "payment" | "summary">("address");
  const [shipping, setShipping] = useState(initialAddress);
  const [utr, setUtr] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!user) {
    return <div className="max-w-xl mx-auto py-16 text-center">Please sign in to checkout.</div>;
  }
  if (cart.length === 0) {
    return <div className="max-w-xl mx-auto py-16 text-center">Your cart is empty.</div>;
  }

  // Step 1: Address form
  const handleAddressNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipping.street || !shipping.city || !shipping.state || !shipping.zipCode || !shipping.country) {
      setError("Please fill all shipping fields.");
      return;
    }
    setError(null);
    setStep("payment");
  };

  // Step 2: Payment form after bank details show
  const handlePaymentNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr) {
      setError("Please enter UTR number.");
      return;
    }
    setError(null);
    setStep("summary");
  };

  // Step 3: Save everything to Supabase
  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    let paymentProofUrl: string | null = null;
    if (paymentProof) {
      // Save payment proof file to storage, bucket: "payment-proofs"
      const fileName = `${user.id}_${Date.now()}_${paymentProof.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, paymentProof);
      if (uploadErr) {
        setSaving(false);
        setError("Failed to upload payment proof.");
        return;
      }
      paymentProofUrl = `https://hdoefblcoavpzvfiiglm.supabase.co/storage/v1/object/public/payment-proofs/${fileName}`;
    }

    // Create order
    const { data: newOrder, error: orderErr } = await supabase
      .from("orders")
      .insert([{
        buyer_id: user.id,
        total_amount: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        shipping_address: shipping,
        status: "pending_payment",
        payment_status: "pending",
        payment_reference: utr,
        payment_proof_url: paymentProofUrl,
        notes: null,
      }])
      .select()
      .single();

    if (orderErr) {
      setSaving(false);
      setError("Could not save your order.");
      return;
    }

    // Save order_items
    const itemsToInsert = cart.map(item => ({
      order_id: newOrder.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(itemsToInsert);
    if (itemsErr) {
      setSaving(false);
      setError("Could not save order items.");
      return;
    }

    // Create invoice
    const { error: invErr } = await supabase.from("invoices").insert([
      {
        order_id: newOrder.id,
        buyer_id: user.id,
        amount: newOrder.total_amount,
        total_amount: newOrder.total_amount,
        status: "draft",
        due_date: new Date().toISOString(), // <-- fix: pass as string
        invoice_number: `INV-${Date.now()}`,
      }
    ]);
    if (invErr) {
      setSaving(false);
      setError("Could not create invoice.");
      return;
    }

    clearCart();
    setSaving(false);
    toast({ title: "Order submitted!", description: "Admin will review after payment is received." });
    navigate("/");
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {step === "address" && (
        <form className="space-y-4" onSubmit={handleAddressNext}>
          <h2 className="font-semibold mb-2">Shipping Address</h2>
          <Input placeholder="Street Address" value={shipping.street} onChange={e => setShipping(s => ({ ...s, street: e.target.value }))} />
          <Input placeholder="City" value={shipping.city} onChange={e => setShipping(s => ({ ...s, city: e.target.value }))} />
          <Input placeholder="State" value={shipping.state} onChange={e => setShipping(s => ({ ...s, state: e.target.value }))} />
          <Input placeholder="Zip Code" value={shipping.zipCode} onChange={e => setShipping(s => ({ ...s, zipCode: e.target.value }))} />
          <Input placeholder="Country" value={shipping.country} onChange={e => setShipping(s => ({ ...s, country: e.target.value }))} />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button type="submit" className="w-full mt-2">Next: Payment</Button>
        </form>
      )}

      {step === "payment" && (
        <form className="space-y-4" onSubmit={handlePaymentNext}>
          <h2 className="font-semibold mb-2">Bank Transfer Details</h2>
          <div className="bg-gray-100 rounded p-3 mb-2">
            <p><strong>Bank Name:</strong> {BANK_ACCOUNT.bankName}</p>
            <p><strong>Account Holder Name:</strong> {BANK_ACCOUNT.accountName}</p>
            <p><strong>Account Number:</strong> {BANK_ACCOUNT.accountNumber}</p>
            <p><strong>IFSC Code:</strong> {BANK_ACCOUNT.ifsc}</p>
          </div>
          <div className="mb-2 text-gray-700 text-sm">
            Please complete payment via NEFT/IMPS using these details. Then enter your payment UTR/reference number and (optionally) upload payment proof for admin verification.
          </div>
          <Input placeholder="UTR / Reference Number" value={utr} onChange={e => setUtr(e.target.value)} />
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={e => setPaymentProof(e.target.files?.[0] ?? null)}
            className="block mt-2"
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button type="submit" className="w-full mt-2">Next: Review & Place Order</Button>
        </form>
      )}

      {step === "summary" && (
        <div>
          <h2 className="font-semibold mb-3">Order Summary</h2>
          <ul className="divide-y border rounded mb-4">
            {cart.map(item => (
              <li key={item.productId} className="flex justify-between items-center p-2">
                <span>{item.name} × {item.quantity}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mb-2">
            <div className="text-sm text-gray-700">Shipping to: <span className="font-medium">{shipping.street}, {shipping.city}</span></div>
            <div className="text-sm text-gray-700">Payment Ref: <span className="font-medium">{utr}</span> {paymentProof && <span>(file attached)</span>}</div>
            <div className="font-bold">Total: ₹{cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</div>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button
            disabled={saving}
            className="w-full mt-4"
            onClick={handleSubmit}
          >
            {saving ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
