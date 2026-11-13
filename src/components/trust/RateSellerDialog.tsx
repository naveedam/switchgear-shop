import { useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface Props {
  sellerOrderId: string;
  sellerId: string;
  sellerName: string;
  onDone?: () => void;
}

export default function RateSellerDialog({ sellerOrderId, sellerId, sellerName, onDone }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [onTime, setOnTime] = useState(true);
  const [genuine, setGenuine] = useState(true);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user || rating < 1) return;
    setSaving(true);
    const { error } = await supabase.from("seller_reviews").insert({
      seller_order_id: sellerOrderId,
      seller_id: sellerId,
      buyer_id: user.id,
      rating,
      on_time: onTime,
      genuine_product: genuine,
      comment: comment.trim() || null,
    });
    setSaving(false);
    if (error) {
      const dup = error.code === "23505";
      toast({ title: dup ? "Already rated" : "Could not submit", description: dup ? undefined : error.message, variant: "destructive" });
      if (dup) setOpen(false);
      return;
    }
    toast({ title: "Thanks for the feedback" });
    setOpen(false);
    onDone?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 text-xs">
          <Star className="mr-1 h-3 w-3" /> Rate seller
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate {sellerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star`}
                onClick={() => setRating(n)} className="p-1">
                <Star className={`h-7 w-7 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="ontime" checked={onTime} onCheckedChange={(v) => setOnTime(v === true)} />
            <Label htmlFor="ontime">Delivered on the promised date</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="genuine" checked={genuine} onCheckedChange={(v) => setGenuine(v === true)} />
            <Label htmlFor="genuine">Genuine product with proper GST invoice</Label>
          </div>
          <Textarea placeholder="Anything other buyers should know? (optional)" maxLength={1000}
            value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={rating < 1 || saving}>{saving ? "Submitting…" : "Submit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
