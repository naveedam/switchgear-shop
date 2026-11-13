// Shared auth + rate-limit guard for edge functions.
// The gateway's verify_jwt accepts the public anon key, so every function
// must resolve the real user itself before doing privileged work.
import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export type Role = "admin" | "seller" | "buyer";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) return json({ error: err.message }, err.status);
  console.error(err);
  return json({ error: "Internal error" }, 500);
}

let _admin: SupabaseClient | null = null;
export function adminClient(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
  }
  return _admin;
}

export interface Caller {
  user: User;
  role: Role | null;
}

/** Resolve the signed-in caller. Throws 401 if there is none. */
export async function requireUser(req: Request, roles?: Role[]): Promise<Caller> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Sign in required");

  const db = adminClient();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Sign in required");

  const { data: company } = await db
    .from("companies")
    .select("role, status")
    .eq("id", data.user.id)
    .maybeSingle();

  let role = (company?.role as Role | undefined) ?? null;
  // Super admins live in admin_users.
  if (role !== "admin") {
    const { data: adminRow } = await db
      .from("admin_users")
      .select("id")
      .eq("id", data.user.id)
      .eq("status", "active")
      .maybeSingle();
    if (adminRow) role = "admin";
  }

  if (roles && (!role || !roles.includes(role))) {
    throw new HttpError(403, "Not allowed");
  }
  return { user: data.user, role };
}

/** Returns the caller if signed in, otherwise null (for guest-capable endpoints). */
export async function optionalUser(req: Request): Promise<Caller | null> {
  try {
    return await requireUser(req);
  } catch {
    return null;
  }
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

/**
 * Fixed-window rate limit backed by the hit_rate_limit() SQL function.
 * Throws 429 when the bucket is exhausted.
 */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<void> {
  const { data, error } = await adminClient().rpc("hit_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    // Fail closed: if the limiter is down, don't hand out free AI calls.
    console.error("rate limit error", error);
    throw new HttpError(503, "Please try again shortly");
  }
  if (data === false) throw new HttpError(429, "Too many requests, please slow down");
}
