import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

/** Normalise an Indian mobile number to WhatsApp's E.164-without-plus format. */
export function normaliseWhatsApp(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return digits;
  if (/^0[6-9]\d{9}$/.test(digits)) return `91${digits.slice(1)}`;
  return null;
}

export default function WhatsAppSettings({ audience }: { audience: "buyer" | "seller" }) {
  const { user } = useAuth();
  const [number, setNumber] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("companies")
      .select("whatsapp_number, whatsapp_opt_in")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.whatsapp_number) setNumber(String(data.whatsapp_number).replace(/^91/, ""));
        setOptIn(Boolean(data?.whatsapp_opt_in));
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    const normalised = number.trim() ? normaliseWhatsApp(number) : null;
    if (number.trim() && !normalised) {
      toast({ title: "Enter a valid 10-digit Indian mobile number", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("companies")
      .update({ whatsapp_number: normalised, whatsapp_opt_in: Boolean(normalised) && optIn })
      .eq("id", user.id);
    setSaving(false);
    toast(error ? { title: "Could not save", description: error.message, variant: "destructive" } : { title: "WhatsApp alerts updated" });
  };

  const what =
    audience === "seller"
      ? "new orders and RFQs the moment they arrive"
      : "quotes received, order confirmations and dispatch tracking";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5 text-green-600" /> WhatsApp alerts
        </CardTitle>
        <CardDescription>Get {what} on WhatsApp.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <Label htmlFor="wa">WhatsApp number</Label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm">+91</span>
              <Input id="wa" className="rounded-l-none" inputMode="numeric" placeholder="98xxxxxxxx"
                value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Switch id="wa-opt" checked={optIn} onCheckedChange={setOptIn} />
            <Label htmlFor="wa-opt">Send me alerts</Label>
          </div>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
      </CardContent>
    </Card>
  );
}
