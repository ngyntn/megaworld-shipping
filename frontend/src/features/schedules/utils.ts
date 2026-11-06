import type { Schedule } from "@/features/operations/types";

export function matchesScheduleSearch(row: Schedule, search: string) {
  return `${row.vessel_name} ${row.voyage} ${row.route.pol.name} ${row.route.pod.name} ${row.carrier.code}`.toLowerCase().includes(search.toLowerCase());
}
