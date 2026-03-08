

# System Improvement Pass: BOM Validation, Confidence Scoring, Normalization, and RFQ Reliability

This plan covers 10 areas of improvement across the Smart BOM Builder, RFQ workflow, and admin tooling. Changes are scoped to avoid breaking existing UI patterns.

---

## 1. BOM Validation Engine

**New file: `src/lib/bomValidation.ts`**

Create a category-specific validation rules map defining required fields per component type:

```text
MCCB → rated_current, poles, breaking_capacity, rated_voltage
Contactor → rated_current, rated_voltage, power_rating
Relay → rated_voltage, poles
CT → rated_current, power_rating
MCB → rated_current, poles, breaking_capacity
VFD → power_rating, rated_voltage
```

Export a `validateBomItem(item: ProjectBomItem)` function that returns `{ status: 'complete' | 'missing_fields' | 'needs_review', missingFields: string[] }`.

**Update `supabase/functions/parse-bom-document/index.ts`**: After AI parsing, run validation logic server-side to set `validation_status` per item.

**Update `ProjectDetailPage.tsx`**: Block RFQ submission if any item has `needs_review` status. Show a warning banner: "X items need review before RFQ can be submitted." Highlight rows with missing fields using a red/amber left border.

---

## 2. Confidence Scoring Improvement

**In `src/lib/bomValidation.ts`**: Add a `calculateConfidence(item)` function that scores based on:
- Fields extracted vs required fields for that component type (40% weight)
- Category certainty — whether `category_slug` is set (20% weight)
- Spec completeness — how many optional specs are filled (20% weight)
- Brand/model presence (20% weight)

Returns 0.0–1.0. Thresholds remain: ≥0.7 High, ≥0.4 Medium, <0.4 Needs Review.

**Update edge function**: Apply this scoring after AI returns results (replace the simple `confidence_score` the AI provides).

---

## 3. BOM Normalization

**New file: `src/lib/bomNormalization.ts`**

Functions to normalize raw AI output:
- `normalizeRatedCurrent("250A")` → `"250 A"`
- `normalizePoles("4P")` → `"4P"` (already consistent)
- `normalizeBreakingCapacity("36kA")` → `"36 kA"`
- `normalizeVoltage("24V DC")` → `"24 V DC"`
- `normalizeQuantity(val)` → ensures integer ≥ 1

**Apply in edge function**: After AI parsing, normalize all values before database insert. Also apply client-side when users edit inline.

---

## 4. Duplicate Component Detection

**New file: `src/lib/bomDuplicateDetection.ts`**

Function `detectDuplicates(items: ProjectBomItem[])` that:
- Groups items by `component_type`
- Within each group, compares key specs (rated_current, poles, breaking_capacity)
- If specs match, flags as potential duplicate
- Returns `{ groups: Array<{ indices: number[], suggestedQuantity: number }> }`

**Update `ProjectDetailPage.tsx` BOM tab**: Show a yellow banner when duplicates are detected: "X potential duplicate groups found." Add a "Merge" button per group that sums quantities and removes the duplicate row.

---

## 5. Seller Routing Readiness

Already implemented via `route-rfq-sellers` edge function. Improvements:
- **Admin Review Queue**: When `sellers_invited === 0` after routing, set RFQ status to `admin_review` instead of silently proceeding. Update the type definition to include this status.
- **Update `convertToRfq`**: After routing returns 0 sellers, show toast: "No matching sellers found. RFQ sent to admin for manual routing."

---

## 6. Admin RFQ Control Panel Enhancement

**Update `AdminRfqs.tsx`**:
- Add a "Manually Invite Seller" button in the RFQ detail dialog (dropdown of active vendors not yet invited)
- Add a "Resend RFQ" button that re-triggers `route-rfq-sellers`
- Add BOM completeness column showing `complete/total` ratio
- Add summary stats cards at top: Total RFQs, Open, Awaiting Quotes, Converted

---

## 7. Quote Comparison UI Improvement

**Update `RfqDetailPage.tsx`**:
- Add columns for: lead time, brand offered, model number, seller notes
- Add visual indicators: lowest price highlighted in green, longest lead time in amber
- Show a "Best Value" badge on the quote item with the lowest price per RFQ item
- Ensure multi-seller order splitting messaging is clearer with per-seller subtotals in the sidebar

---

## 8. Response Time Tracking

**Database migration**: Add columns to `rfq_seller_invitations`:
- `first_quote_at TIMESTAMPTZ` (set when seller submits first quote)

**Update `useRfqService.ts` `submitQuote`**: Record `first_quote_at` on the invitation when the seller submits.

**Update `AdminRfqs.tsx` detail dialog**: Show response time per seller (time between `invited_at` and `first_quote_at`). Show aggregate metrics: average response time, quote rate.

---

## 9. System Reliability — Error Handling

**Update `useProjectService.ts`**:
- Wrap all Supabase calls in try/catch with user-friendly error messages
- Add specific error messages: "PDF extraction failed — try pasting text manually", "AI parsing returned no results — check document format"
- Add retry logic for transient failures (edge function timeouts)

**Update `ProjectDetailPage.tsx`**:
- Show inline error states per document (not just toast)
- Add a "Retry" button for failed extractions/parsings

**Update edge functions**: Add structured error responses with error codes for frontend handling.

---

## 10. Future Extensibility (Code Structure Only)

- Structure `bomValidation.ts` with a plugin-style rules registry so new component types can be added without modifying core logic
- Add `routing_version` field to audit logs (already present as `routing_method`)
- Add placeholder interfaces in `src/types/project.ts` for `SellerPerformanceScore` and `PriceBenchmark`

---

## Implementation Order

1. BOM Normalization + Validation Engine (shared lib files)
2. Confidence Scoring (update edge function + lib)
3. Duplicate Detection (lib + UI)
4. RFQ submission gate (block if items need review)
5. Admin RFQ enhancements (manual invite, resend, stats)
6. Quote Comparison UI improvements
7. Response Time Tracking (migration + UI)
8. Error handling improvements
9. Seller routing admin_review fallback
10. Future extensibility types

**Files to create**: `src/lib/bomValidation.ts`, `src/lib/bomNormalization.ts`, `src/lib/bomDuplicateDetection.ts`

**Files to edit**: `supabase/functions/parse-bom-document/index.ts`, `src/pages/buyer/ProjectDetailPage.tsx`, `src/pages/buyer/RfqDetailPage.tsx`, `src/pages/admin/AdminRfqs.tsx`, `src/hooks/useProjectService.ts`, `src/hooks/useRfqService.ts`, `src/types/project.ts`

**Database migration**: Add `first_quote_at` to `rfq_seller_invitations`

