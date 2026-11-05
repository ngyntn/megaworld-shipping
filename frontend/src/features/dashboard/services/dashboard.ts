import 'server-only';
import { requireSession } from '@/features/auth/services/session';
import { getCarrierLogos } from '@/lib/pocketbase/files';
import type { DashboardData, DashboardRate } from '../types';
export async function getDashboard() {
  const { pb } = await requireSession();
  const [data, logos] = await Promise.all([
    pb.send<DashboardData>('/api/megaworld/admin/dashboard', { method: 'GET', cache: 'no-store' }),
    getCarrierLogos(pb),
  ]);
  const withLogo = (rate: DashboardRate) => ({ ...rate, carrierLogoUrl: logos.get(rate.carrier) || '' });
  return { ...data, latest_rates: data.latest_rates.map(withLogo), expiring_rates: data.expiring_rates.map(withLogo), significant_changes: data.significant_changes.map(withLogo) };
}
export async function getStorefrontSlug() {
  const { pb, staff } = await requireSession();
  const result = await pb.collection('storefronts').getList(1, 1, { filter: pb.filter('owner = {:owner} && published = true', { owner: staff.id }), fields: 'slug', requestKey: null });
  return result.items[0]?.slug as string | undefined;
}
