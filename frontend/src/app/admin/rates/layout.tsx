import { requireSession } from "@/features/auth/services/session";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { getStorefrontSlug } from "@/features/dashboard/services/dashboard";
import "@/styles/rates.css";
export default async function RatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  const slug = await getStorefrontSlug();
  return (
    <div className="admin-shell rates-shell">
      <AdminSidebar
        active="/admin/rates"
        customerUrl={slug ? `/s/${slug}/rates` : undefined}
      />
      <div className="rates-main">{children}</div>
    </div>
  );
}
