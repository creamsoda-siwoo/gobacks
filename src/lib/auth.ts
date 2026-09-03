import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

export const ADMIN_SESSION_COOKIE = "admin_session";

const secret = new TextEncoder().encode(
  process.env.ADMIN_SESSION_SECRET ?? "dev-only-session-secret-change-me"
);

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const plain = process.env.ADMIN_PASSWORD;

  if (hash) return bcrypt.compare(password, hash);
  if (plain) return password === plain; // dev convenience fallback only
  return false;
}

export async function createAdminSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifyAdminSessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}
