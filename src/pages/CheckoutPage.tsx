import React, { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCartWithSellers } from "@/hooks/useCartWithSellers";
import MultiSellerNotice from "@/components/checkout/MultiSellerNotice";
import CartBySeller from "@/components/checkout/CartBySeller";
import { Store, CreditCard, MapPin, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BANK_ACCOUNT = {
  accountNumber: "123456789012",
  ifsc: "SBIN0000123",
  bankName: "State Bank of India",
  accountName: "SwitchgearShop Pvt Ltd",
};

const initialAddress = { street: "", city: "", state: "", zipCode: "", country: "India" };

const CheckoutPage: React.FC = () => {
  const { clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { groupedBySeller, isMultiSeller, totalAmount, sellerCount, isLoading: cartLoading } = useCartWithSellers();
  
  const [step, setStep] = useState<"address" | "payment" | "summary">("address");
  const [shipping, setShipping] = useState(initialAddress);
  const [buyerGstin, setBuyerGstin] = useState("");
  const [buyerCompanyName, setBuyerCompanyName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState(user?.email || "");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [isB2B, setIsB2B] = useState(false);
  const [utr, setUtr] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <p className="text-muted-foreground">Please sign in to checkout.</p>
        <Button className="mt-4" onClick={() => navigate("/login")}>Sign In</Button>
      </div>
    );
  }
  
  if (cartLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    );
  }
  
  if (groupedBySeller.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button className="mt-4" onClick={() => navigate("/categories")}>Browse Products</Button>
      </div>
    );
  }

  const handleAddressNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipping.street || !shipping.city || !shipping.state || !shipping.zipCode) {
      setError("Please fill all shipping fields.");
      return;
    }
    if (isB2B && !buyerGstin) {
      setError("Please enter your GSTIN for B2B orders.");
      return;
    }
    if (isB2B && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(buyerGstin)) {
      setError("Please enter a valid 15-character GSTIN.");
      return;
    }
    setError(null);
    setStep("payment");
  };

  const handlePaymentNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr) {
      setError("Please enter UTR number.");
      return;
    }
    setError(null);
    setStep("summary");
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      let paymentProofUrl: string | null = null;
      if (paymentProof) {
        const fileName = `${user.id}/${Date.now()}_${paymentProof.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("payment-proofs")
          .upload(fileName, paymentProof);
        if (uploadErr) throw new Error("Failed to upload payment proof.");
        paymentProofUrl = fileName;
      }

      // Create parent order
      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert([{
          buyer_id: user.id,
          total_amount: totalAmount,
          shipping_address: shipping,
          status: "pending",
          payment_status: "pending",
          payment_reference: utr,
          payment_proof_url: paymentProofUrl,
          buyer_gstin: isB2B ? buyerGstin : null,
          buyer_company_name: isB2B ? buyerCompanyName : null,
          buyer_email: buyerEmail,
          buyer_phone: buyerPhone,
          is_multi_seller: isMultiSeller,
        }])
        .select()
        .single();

      if (orderErr) throw new Error("Could not save your order.");

      // Create seller sub-orders and order items
      for (const group of groupedBySeller) {
        // Create seller order
        const { data: sellerOrder, error: sellerOrderErr } = await supabase
          .from("seller_orders")
          .insert([{
            order_id: newOrder.id,
            seller_id: group.sellerId,
            status: "pending",
            subtotal: group.subtotal,
            tax_amount: 0, // Will be calculated by seller
            shipping_amount: 0,
            total_amount: group.subtotal,
          }])
          .select()
          .single();

        if (sellerOrderErr) {
          console.error("Error creating seller order:", sellerOrderErr);
          throw new Error("Could not create seller sub-order.");
        }

        // Create order items linked to seller order
        const itemsToInsert = group.items.map(item => ({
          order_id: newOrder.id,
          seller_order_id: sellerOrder.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        }));

        const { error: itemsErr } = await supabase.from("order_items").insert(itemsToInsert);
        if (itemsErr) {
          console.error("Error creating order items:", itemsErr);
          throw new Error("Could not save order items.");
        }
      }

      clearCart();
      toast({ 
        title: "Order submitted!", 
        description: isMultiSeller 
          ? `Your order has been split across ${sellerCount} sellers. Each seller will process their portion.`
          : "Your order is being processed." 
      });
      navigate(`/order-success?orderId=${newOrder.id}`);
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "An error occurred during checkout.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {/* Multi-seller notice */}
      <MultiSellerNotice 
        groupedBySeller={groupedBySeller} 
        isMultiSeller={isMultiSeller} 
      />

      {/* Platform disclaimer */}
      <Alert className="mb-6 bg-muted/50 border-muted-foreground/20">
        <FileText className="h-4 w-4" />
        <AlertDescription className="text-sm text-muted-foreground">
          <strong>Escrow Payment Model:</strong> Your payment is held securely in SwitchgearShop's nodal account. 
          Sellers are paid after fulfillment milestones (order acceptance, invoice upload, shipment). 
          GST tax invoices will be issued by respective sellers, not by SwitchgearShop. 
          SwitchgearShop acts as a marketplace facilitator only.
        </AlertDescription>
      </Alert>

      {step === "address" && (
        <form className="space-y-6" onSubmit={handleAddressNext}>
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input 
                    id="street"
                    placeholder="Enter street address" 
                    value={shipping.street} 
                    onChange={e => setShipping(s => ({ ...s, street: e.target.value }))} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city"
                      placeholder="City" 
                      value={shipping.city} 
                      onChange={e => setShipping(s => ({ ...s, city: e.target.value }))} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input 
                      id="state"
                      placeholder="State" 
                      value={shipping.state} 
                      onChange={e => setShipping(s => ({ ...s, state: e.target.value }))} 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">PIN Code</Label>
                    <Input 
                      id="zipCode"
                      placeholder="PIN Code" 
                      value={shipping.zipCode} 
                      onChange={e => setShipping(s => ({ ...s, zipCode: e.target.value }))} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input 
                      id="country"
                      value={shipping.country} 
                      onChange={e => setShipping(s => ({ ...s, country: e.target.value }))} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* B2B / GST Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="h-5 w-5" />
                Business Details (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isB2B" 
                  checked={isB2B} 
                  onCheckedChange={(checked) => setIsB2B(!!checked)} 
                />
                <Label htmlFor="isB2B" className="text-sm font-medium">
                  I have a GST number (B2B Order)
                </Label>
              </div>
              
              {isB2B && (
                <div className="grid gap-4 pt-2">
                  <div>
                    <Label htmlFor="gstin">GSTIN *</Label>
                    <Input 
                      id="gstin"
                      placeholder="e.g., 29AABCU9603R1ZM" 
                      value={buyerGstin}
                      onChange={e => setBuyerGstin(e.target.value.toUpperCase())}
                      maxLength={15}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your GSTIN will be shared with sellers for invoice generation
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input 
                      id="companyName"
                      placeholder="Legal business name" 
                      value={buyerCompanyName}
                      onChange={e => setBuyerCompanyName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="Email address" 
                    value={buyerEmail}
                    onChange={e => setBuyerEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone"
                    placeholder="Phone number" 
                    value={buyerPhone}
                    onChange={e => setBuyerPhone(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button type="submit" className="w-full" size="lg">
            Continue to Payment
          </Button>
        </form>
      )}

      {step === "payment" && (
        <form className="space-y-6" onSubmit={handlePaymentNext}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Bank Transfer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Bank Name:</span>
                  <span className="font-medium">{BANK_ACCOUNT.bankName}</span>
                  <span className="text-muted-foreground">Account Holder:</span>
                  <span className="font-medium">{BANK_ACCOUNT.accountName}</span>
                  <span className="text-muted-foreground">Account Number:</span>
                  <span className="font-mono font-medium">{BANK_ACCOUNT.accountNumber}</span>
                  <span className="text-muted-foreground">IFSC Code:</span>
                  <span className="font-mono font-medium">{BANK_ACCOUNT.ifsc}</span>
                </div>
              </div>
              
              <div className="bg-primary/5 rounded-lg p-4 text-sm">
                <p className="mb-2">
                  <strong>Amount to transfer:</strong>{" "}
                  <span className="text-lg font-bold">₹{totalAmount.toLocaleString('en-IN')}</span>
                </p>
                <p className="text-muted-foreground">
                  Complete payment via NEFT/IMPS/RTGS and enter your UTR/reference number below.
                </p>
              </div>

              <div>
                <Label htmlFor="utr">UTR / Reference Number *</Label>
                <Input 
                  id="utr"
                  placeholder="Enter payment reference" 
                  value={utr} 
                  onChange={e => setUtr(e.target.value)} 
                />
              </div>

              <div>
                <Label htmlFor="proof">Payment Proof (Optional)</Label>
                <Input
                  id="proof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => setPaymentProof(e.target.files?.[0] ?? null)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a screenshot or PDF of your payment confirmation
                </p>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => setStep("address")} className="flex-1">
              Back
            </Button>
            <Button type="submit" className="flex-1" size="lg">
              Review Order
            </Button>
          </div>
        </form>
      )}

      {step === "summary" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CartBySeller groupedBySeller={groupedBySeller} />
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping to:</span>
                  <span className="text-right">
                    {shipping.street}, {shipping.city}, {shipping.state} {shipping.zipCode}
                  </span>
                </div>
                {isB2B && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GSTIN:</span>
                    <span className="font-mono">{buyerGstin}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Reference:</span>
                  <span className="font-mono">{utr}</span>
                </div>
                {paymentProof && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Proof Attached:</span>
                    <span className="text-green-600">✓ {paymentProof.name}</span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Order Total</span>
                <span className="text-2xl font-bold">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              
              {isMultiSeller && (
                <p className="text-sm text-muted-foreground">
                  You will receive {sellerCount} separate shipments from different sellers.
                </p>
              )}
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => setStep("payment")} className="flex-1">
              Back
            </Button>
            <Button 
              disabled={saving} 
              onClick={handleSubmit}
              className="flex-1" 
              size="lg"
            >
              {saving ? "Placing Order..." : "Place Order"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
