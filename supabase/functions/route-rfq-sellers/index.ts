import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_SELLERS_PER_CATEGORY = 5;
const MAX_TOTAL_SELLERS = 8;

interface SellerCandidate {
  seller_id: string;
  categories: string[];
  product_count: number;
  updated_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rfqId, projectId } = await req.json();

    if (!rfqId) {
      return new Response(JSON.stringify({ error: "rfqId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Get distinct category_slugs from BOM items for this project/RFQ
    let categorySlugs: string[] = [];

    if (projectId) {
      const { data: bomItems } = await supabase
        .from("project_bom_items")
        .select("category_slug")
        .eq("project_id", projectId)
        .not("category_slug", "is", null);

      categorySlugs = [
        ...new Set((bomItems || []).map((i: any) => i.category_slug).filter(Boolean)),
      ];
    }

    // Also check rfq_items category if available
    if (categorySlugs.length === 0) {
      const { data: rfqData } = await supabase
        .from("rfqs")
        .select("bom_id")
        .eq("id", rfqId)
        .single();

      if (rfqData?.bom_id) {
        const { data: bomItems } = await supabase
          .from("bom_items")
          .select("description")
          .eq("bom_id", rfqData.bom_id);
        // No category_slug on bom_items, so we'll rely on project_bom_items
      }
    }

    console.log(`[route-rfq] RFQ ${rfqId}: detected categories:`, categorySlugs);

    // 2. Find eligible sellers via seller_categories
    let sellerMap = new Map<string, SellerCandidate>();

    if (categorySlugs.length > 0) {
      // Get sellers mapped to these categories, ordered by product_count desc
      const { data: sellerCats } = await supabase
        .from("seller_categories")
        .select("seller_id, category_slug, product_count, updated_at")
        .in("category_slug", categorySlugs);

      // Get active, vendor companies
      const { data: activeVendors } = await supabase
        .from("companies")
        .select("id, updated_at")
        .eq("is_vendor", true)
        .eq("status", "active");

      const activeIds = new Set((activeVendors || []).map((v: any) => v.id));

      // Also check seller_onboarding: only approved sellers are eligible
      const { data: approvedOnboarding } = await supabase
        .from("seller_onboarding")
        .select("user_id")
        .eq("status", "approved");

      const approvedIds = new Set(
        (approvedOnboarding || []).map((o: any) => o.user_id)
      );

      // A seller must be both active in companies AND approved in onboarding
      // If no onboarding records exist yet (legacy sellers), allow active vendors through
      const hasOnboardingRecords = (approvedOnboarding || []).length > 0;

      const eligibleIds = new Set(
        [...activeIds].filter(
          (id) => !hasOnboardingRecords || approvedIds.has(id)
        )
      );

      const vendorUpdated = new Map(
        (activeVendors || []).map((v: any) => [v.id, v.updated_at])
      );

      // Build per-category lists, filter active only
      const categoryBuckets = new Map<string, SellerCandidate[]>();

      for (const sc of sellerCats || []) {
        if (!eligibleIds.has(sc.seller_id)) continue;

        if (!sellerMap.has(sc.seller_id)) {
          sellerMap.set(sc.seller_id, {
            seller_id: sc.seller_id,
            categories: [],
            product_count: 0,
            updated_at: vendorUpdated.get(sc.seller_id) || sc.updated_at,
          });
        }

        const candidate = sellerMap.get(sc.seller_id)!;
        candidate.categories.push(sc.category_slug);
        candidate.product_count += sc.product_count || 0;

        if (!categoryBuckets.has(sc.category_slug)) {
          categoryBuckets.set(sc.category_slug, []);
        }
        categoryBuckets.get(sc.category_slug)!.push(candidate);
      }

      // 3. Apply per-category cap
      const selectedIds = new Set<string>();

      for (const [_cat, candidates] of categoryBuckets) {
        // Sort by product_count desc, then updated_at desc
        candidates.sort((a, b) => {
          if (b.product_count !== a.product_count)
            return b.product_count - a.product_count;
          return (
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
          );
        });

        let count = 0;
        for (const c of candidates) {
          if (count >= MAX_SELLERS_PER_CATEGORY) break;
          if (selectedIds.size >= MAX_TOTAL_SELLERS) break;
          selectedIds.add(c.seller_id);
          count++;
        }
      }

      // Filter sellerMap to only selected
      const finalSellers = [...selectedIds]
        .map((id) => sellerMap.get(id)!)
        .filter(Boolean);

      sellerMap = new Map(finalSellers.map((s) => [s.seller_id, s]));
    }

    // Fallback: if no category matches, invite top active sellers (capped)
    if (sellerMap.size === 0) {
      console.log("[route-rfq] No category matches, using fallback active sellers");
      const { data: fallbackSellers } = await supabase
        .from("companies")
        .select("id, updated_at")
        .eq("is_vendor", true)
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(MAX_TOTAL_SELLERS);

      for (const s of fallbackSellers || []) {
        sellerMap.set(s.id, {
          seller_id: s.id,
          categories: categorySlugs,
          product_count: 0,
          updated_at: s.updated_at,
        });
      }
    }

    // 4. Check for existing invitations to prevent duplicates
    const { data: existingInvites } = await supabase
      .from("rfq_seller_invitations")
      .select("seller_id")
      .eq("rfq_id", rfqId);

    const existingIds = new Set(
      (existingInvites || []).map((i: any) => i.seller_id)
    );

    // 5. Create invitations
    const now = new Date().toISOString();
    const newInvitations = [...sellerMap.values()]
      .filter((s) => !existingIds.has(s.seller_id))
      .map((s) => ({
        rfq_id: rfqId,
        seller_id: s.seller_id,
        status: "pending",
        matched_categories: s.categories,
        routing_method: "category_auto",
        routing_score: s.product_count,
        notification_sent_at: now,
        notification_channel: "in_app",
      }));

    if (newInvitations.length > 0) {
      const { error: insertError } = await supabase
        .from("rfq_seller_invitations")
        .insert(newInvitations);

      if (insertError) {
        console.error("[route-rfq] Insert error:", insertError);
        throw insertError;
      }
    }

    const totalInvited = newInvitations.length + existingIds.size;

    // 6. Update RFQ with routing metadata
    await supabase
      .from("rfqs")
      .update({
        categories_detected: categorySlugs,
        sellers_invited: totalInvited,
      })
      .eq("id", rfqId);

    // 7. Audit log
    await supabase.from("rfq_audit_log").insert({
      rfq_id: rfqId,
      action: "sellers_auto_routed",
      actor_type: "system",
      details: {
        categories_detected: categorySlugs,
        sellers_invited: newInvitations.length,
        total_candidates: sellerMap.size,
        routing_method: "category_auto_v1",
        max_per_category: MAX_SELLERS_PER_CATEGORY,
        max_total: MAX_TOTAL_SELLERS,
      },
    });

    // 8. Get RFQ details for notification content
    const { data: rfqDetails } = await supabase
      .from("rfqs")
      .select("rfq_number, title, total_items, expires_at")
      .eq("id", rfqId)
      .single();

    // 9. Create notifications for invited sellers
    for (const inv of newInvitations) {
      const categoryList = inv.matched_categories.join(", ") || "General";
      const expiryNote = rfqDetails?.expires_at
        ? ` Expires: ${new Date(rfqDetails.expires_at).toLocaleDateString("en-IN")}.`
        : "";

      await supabase.from("notifications").insert({
        user_id: inv.seller_id,
        title: `New RFQ: ${rfqDetails?.rfq_number || "Quote Request"}`,
        message: `You've been invited to quote on "${rfqDetails?.title || "RFQ"}" (${rfqDetails?.total_items || 0} items). Categories: ${categoryList}.${expiryNote} View and submit your quote now.`,
        type: "rfq_invitation",
      });
    }

    console.log(
      `[route-rfq] RFQ ${rfqId}: invited ${newInvitations.length} sellers (${categorySlugs.length} categories)`
    );

    return new Response(
      JSON.stringify({
        success: true,
        sellers_invited: newInvitations.length,
        total_invited: totalInvited,
        categories_detected: categorySlugs,
        routing_method: "category_auto_v1",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[route-rfq] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Routing failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
