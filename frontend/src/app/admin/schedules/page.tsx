import {
  getOperationsCatalog,
  getSchedules,
} from "@/features/operations/services/queries";
import { requireSession } from "@/features/auth/services/session";
import { SchedulesView } from "@/features/schedules/components/schedules-view";
export default async function Page() {
  const [{ staff }, catalog, list] = await Promise.all([
    requireSession(),
    getOperationsCatalog(),
    getSchedules(),
  ]);
  return <SchedulesView name={staff.name} catalog={catalog} initial={list} />;
}
