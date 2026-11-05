import { NextResponse } from "next/server";
import { lockSession } from "@/features/auth/services/hibernate";

// Route handler (not a server action) so locking does not re-render the current page.
export async function POST() {
  const locked = await lockSession();
  return NextResponse.json({ locked }, { status: locked ? 200 : 401 });
}
