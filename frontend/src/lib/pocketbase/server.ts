import 'server-only';
import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';
import { pocketbaseUrl } from '@/lib/env';
export const sessionCookie = 'megaworld_session';
export async function createServerClient() {
  const pb = new PocketBase(pocketbaseUrl);
  pb.autoCancellation(false);
  const token = (await cookies()).get(sessionCookie)?.value;
  if (token) pb.authStore.save(token);
  return pb;
}
