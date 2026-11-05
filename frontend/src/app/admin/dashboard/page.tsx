import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { requireSession } from '@/features/auth/services/session';
import { getDashboard, getStorefrontSlug } from '@/features/dashboard/services/dashboard';
import { DashboardView } from '@/features/dashboard/components/dashboard-view';
export default async function DashboardPage() {
  const { staff } = await requireSession();
  const [data, slug] = await Promise.all([getDashboard(), getStorefrontSlug()]);
  return <div className="admin-shell"><AdminSidebar customerUrl={slug ? `/s/${slug}/rates` : undefined} /><DashboardView data={data} name={staff.name || staff.email} /></div>;
}
