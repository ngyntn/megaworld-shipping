import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/pocketbase/server';
import { ClientResponseError } from 'pocketbase';
export const getSession = cache(async () => {
  const pb = await createServerClient();
  if (!pb.authStore.token) return null;
  try {
    const auth = await pb.collection('staff').authRefresh();
    return auth.record.active ? { pb, staff: auth.record } : null;
  } catch (error) {
    if (error instanceof ClientResponseError && [400, 401, 403].includes(error.status)) return null;
    throw error;
  }
});
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return session;
}
