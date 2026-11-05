import { getOperationsCatalog } from "@/features/operations/services/queries";
import { requireSession } from "@/features/auth/services/session";
import { MasterDataView } from "@/features/master-data/components/master-data-view";
export default async function Page() {
  const [{ staff }, catalog] = await Promise.all([
    requireSession(),
    getOperationsCatalog(),
  ]);
  return <MasterDataView name={staff.name} catalog={catalog} />;
}
