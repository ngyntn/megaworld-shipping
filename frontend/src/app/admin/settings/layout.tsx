import { ModuleShell } from "@/components/layout/module-shell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ModuleShell active="/admin/settings">{children}</ModuleShell>;
}
