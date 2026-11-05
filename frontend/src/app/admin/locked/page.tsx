import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hibernateCookie } from "@/features/auth/hibernate-cookie";
import { HibernateScreen } from "@/features/auth/components/hibernate-screen";

export const metadata = { title: "SeaLogistics" };

export default async function LockedPage() {
  if (!(await cookies()).has(hibernateCookie)) redirect("/admin/dashboard");
  return <HibernateScreen />;
}
