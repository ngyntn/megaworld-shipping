import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { sessionCookie } from "@/lib/pocketbase/server";
import { hibernateCookie } from "../hibernate-cookie";

/**
 * "Ngủ đông" (screen lock). Locking moves the session token into an encrypted cookie and removes
 * the session cookie, so while locked the server has no session at all: data and actions are
 * unavailable even if the overlay is removed in DevTools. Only the PIN restores the session.
 */
const DEFAULT_PIN = "161004";
const pin = () => process.env.HIBERNATE_PIN || DEFAULT_PIN;

// Without SESSION_LOCK_SECRET a per-process key is used: a server restart then simply requires a new login.
const globalKey = globalThis as unknown as { __hibernateKey?: Buffer };
function key() {
  const secret = process.env.SESSION_LOCK_SECRET;
  if (secret) return createHash("sha256").update(secret).digest();
  return (globalKey.__hibernateKey ??= randomBytes(32));
}

function seal(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

function unseal(value: string) {
  try {
    const raw = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Seconds until the PocketBase JWT expires (cookies live exactly as long as the session could). */
function secondsLeft(token: string) {
  try {
    const { exp } = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    return Math.max(0, Math.floor(exp - Date.now() / 1000));
  } catch {
    return 0;
  }
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export async function lockSession() {
  const jar = await cookies();
  if (jar.get(hibernateCookie)) return true;
  const token = jar.get(sessionCookie)?.value;
  if (!token) return false;
  jar.set(hibernateCookie, seal(token), cookieOptions(secondsLeft(token)));
  jar.delete(sessionCookie);
  return true;
}

/** Constant-time check of the admin PIN (also guards "select all → delete"). */
export function isValidPin(input: string) {
  const expected = Buffer.from(pin());
  const given = Buffer.from(String(input));
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export type WakeResult = "ok" | "wrong-pin" | "expired";

export async function unlockSession(input: string): Promise<WakeResult> {
  const jar = await cookies();
  const sealed = jar.get(hibernateCookie)?.value;
  if (!sealed) return "expired";
  if (!isValidPin(input)) {
    await new Promise((resolve) => setTimeout(resolve, 350)); // slow down guessing
    return "wrong-pin";
  }
  jar.delete(hibernateCookie);
  const token = unseal(sealed);
  if (!token || !secondsLeft(token)) return "expired";
  jar.set(sessionCookie, token, cookieOptions(secondsLeft(token)));
  return "ok";
}
