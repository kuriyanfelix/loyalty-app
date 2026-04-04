// src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "loyalty-app-dev-secret-change-in-prod"
);

const STAMPS_PER_REWARD = parseInt(process.env.STAMPS_PER_REWARD || "10");

export { STAMPS_PER_REWARD };

export async function signToken(payload: { userId: string; phone: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string; phone: string };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get("loyalty_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function generateOTP(): string {
  // In production, integrate Twilio/AWS SNS here
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isAdminRequest(req: Request): boolean {
  const adminKey = req.headers.get("x-admin-key");
  return adminKey === (process.env.ADMIN_KEY || "admin-dev-key");
}
