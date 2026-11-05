import { getAccount } from "@/features/operations/services/queries";
import { SettingsView } from "@/features/settings/components/settings-view";
export default async function Page() {
  return <SettingsView account={await getAccount()} />;
}
