// Sends queued WhatsApp template messages via Meta WhatsApp Cloud API.
// Schedule every minute with pg_cron + pg_net (see docs/SECURITY_AND_PAYMENTS.md).
// Only callable with the service role key.
import { adminClient, corsHeaders, errorResponse, HttpError, json } from "../_shared/guard.ts";

const TOKEN = Deno.env.get("WHATSAPP_TOKEN");
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const LANG = Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "en";
const BATCH = 50;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) throw new HttpError(401, "Unauthorized");
    if (!TOKEN || !PHONE_NUMBER_ID) return json({ skipped: "WhatsApp not configured" });

    const db = adminClient();
    const { data: jobs, error } = await db
      .from("notification_outbox")
      .select("id, recipient_id, template, params, attempts")
      .eq("status", "queued")
      .order("created_at")
      .limit(BATCH);
    if (error) throw error;

    let sent = 0, failed = 0;
    for (const job of jobs ?? []) {
      const { data: c } = await db.from("companies")
        .select("whatsapp_number, whatsapp_opt_in").eq("id", job.recipient_id).maybeSingle();
      if (!c?.whatsapp_opt_in || !c.whatsapp_number) {
        await db.from("notification_outbox").update({ status: "skipped" }).eq("id", job.id);
        continue;
      }

      const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: c.whatsapp_number,
          type: "template",
          template: {
            name: job.template,
            language: { code: LANG },
            components: [{
              type: "body",
              parameters: (job.params as unknown[]).map((p) => ({ type: "text", text: String(p ?? "") })),
            }],
          },
        }),
      });

      if (res.ok) {
        sent++;
        await db.from("notification_outbox")
          .update({ status: "sent", sent_at: new Date().toISOString(), attempts: job.attempts + 1 })
          .eq("id", job.id);
      } else {
        failed++;
        const errText = (await res.text()).slice(0, 500);
        await db.from("notification_outbox").update({
          status: job.attempts + 1 >= 3 ? "failed" : "queued",
          attempts: job.attempts + 1,
          last_error: errText,
        }).eq("id", job.id);
      }
    }
    return json({ processed: jobs?.length ?? 0, sent, failed });
  } catch (e) {
    return errorResponse(e);
  }
});
