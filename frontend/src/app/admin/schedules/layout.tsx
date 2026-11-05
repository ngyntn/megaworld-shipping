import { ModuleShell } from "@/components/layout/module-shell";
import "@/styles/rates.css";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ModuleShell active="/admin/schedules">{children}</ModuleShell>;
}
