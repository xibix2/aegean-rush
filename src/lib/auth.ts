// src/lib/auth.ts
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";

/* =========================
   Password verification (unchanged behavior)
   ========================= */
export function verifyAdminPassword(password: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash && typeof hash === "string" && hash.length > 0) {
    try {
      return bcrypt.compareSync(password, hash);
    } catch {
      return false;
    }
  }
  const plain = process.env.ADMIN_PASSWORD;
  if (typeof plain === "string") return password === plain;
  return false;
}

/* =========================
   Minimal signed session token (HMAC, httpOnly cookie)
   ========================= */

// ✅ All roles that can log into the dashboard
export type AdminRole =
  | "SUPERADMIN"
  | "ADMIN"
  | "MANAGER"
  | "COACH"
  | "STAFF";

export type AdminSession = {
  email: string;
  role: AdminRole;
  clubId: string | null; // null for SUPERADMIN
  exp: number; // unix seconds
};

const SESSION_COOKIE = "admin_session";
const AUTH_FLAG_COOKIE = "admin_auth"; // legacy/compat with middleware
const TENANT_SLUG_COOKIE = "tenant_slug"; // set by middleware; optional

function secret(): string {
  const s = process.env.AUTH_HMAC_SECRET;
  if (!s) throw new Error("Missing AUTH_HMAC_SECRET");
  return s;
}

function signSession(payload: AdminSession): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

function verifyToken(token?: string | null): AdminSession | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expSig = crypto
    .createHmac("sha256", secret())
    .update(body)
    .digest("base64url");
  if (sig !== expSig) return null;
  try {
    const data = JSON.parse(
      Buffer.from(body, "base64url").toString()
    ) as AdminSession;
    if (typeof data?.exp !== "number" || Date.now() / 1000 > data.exp) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/* =========================
   Public helpers
   ========================= */
export async function issueAdminSession(input: {
  email: string;
  role: AdminRole;
  clubId: string | null; // null for SUPERADMIN
  hours?: number; // default 8h
  cookiePath?: string; // default "/"
}) {
  const maxHours = Math.max(1, Math.min(72, input.hours ?? 8));
  const exp = Math.floor(Date.now() / 1000) + maxHours * 3600;

  const session: AdminSession = {
    email: input.email,
    role: input.role,
    clubId: input.clubId ?? null,
    exp,
  };

  const token = signSession(session);
  const jar = await cookies();

  // Main httpOnly session
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: input.cookiePath ?? "/",
    maxAge: maxHours * 3600,
  });

  // Compatibility flag for middleware (“admin_auth=yes”)
  jar.set(AUTH_FLAG_COOKIE, "yes", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: input.cookiePath ?? "/",
    maxAge: maxHours * 3600,
  });

  return session;
}

export async function destroyAdminSession(cookiePath = "/") {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { path: cookiePath, maxAge: 0 });
  jar.set(AUTH_FLAG_COOKIE, "", { path: cookiePath, maxAge: 0 });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();

  // Preferred: signed token
  const token = jar.get(SESSION_COOKIE)?.value ?? null;
  const sess = verifyToken(token);
  if (sess) return sess;

  // Back-compat fallback (old cookies)
  const authYes = jar.get(AUTH_FLAG_COOKIE)?.value === "yes";
  const email = jar.get("admin_email")?.value ?? null;
  const role =
    (jar.get("admin_role")?.value as AdminRole | undefined) ?? null;
  const clubId = jar.get("admin_clubId")?.value ?? null;

  if (authYes && email && role) {
    // synthesize a short-lived session (15 min) to avoid breaking old flows
    const exp = Math.floor(Date.now() / 1000) + 15 * 60;
    return { email, role, clubId, exp };
  }

  return null;
}

/** Convenience: read the tenant slug that middleware persists. */
export async function getTenantSlugFromCookie(): Promise<string | null> {
  const val = (await cookies()).get(TENANT_SLUG_COOKIE)?.value ?? null;
  return val && val.length > 0 ? val : null;
}