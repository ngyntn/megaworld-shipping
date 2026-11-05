import { AdminSidebar } from "./admin-sidebar";
import { requireSession } from "@/features/auth/services/session";
import { getStorefrontSlug } from "@/features/dashboard/services/dashboard";
import "@/styles/operations.css";
export async function ModuleShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  await requireSession();
  const slug = await getStorefrontSlug();
  return (
    <div className="admin-shell">
      <AdminSidebar
        active={active}
        customerUrl={slug ? `/s/${slug}/rates` : undefined}
      />
      <main className="admin-main">{children}</main>
    </div>
  );
}
