import { NextResponse } from "next/server";
import { unlockSession } from "@/features/auth/services/hibernate";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pin = typeof body?.pin === "string" ? body.pin.slice(0, 12) : "";
  const result = await unlockSession(pin);
  return NextResponse.json({ result }, { status: result === "ok" ? 200 : result === "wrong-pin" ? 403 : 401 });
}
