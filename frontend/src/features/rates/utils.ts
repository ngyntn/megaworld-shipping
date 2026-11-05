/**
 * A "dòng giá" (price row) groups the container lines (20GP/40GP/40HC…) saved together:
 * same route, carrier, validity, revision state, charges, notes and linked schedules.
 * Shared by the server (counting/paging rows) and the table (rendering rows).
 */
export type GroupFields = {
  route: string;
  carrier: string;
  valid_from: string;
  valid_to: string;
  is_current: boolean;
  revision: number;
  surcharges: string;
  trade_term: string;
  internal_note: string;
  local_charges: string;
  public_note: string;
  cargo_type: string;
  transit_days: number;
  service_type: string;
  schedule_ids: string[];
};

export function rateGroupKey(r: GroupFields) {
  return JSON.stringify([
    r.route,
    r.carrier,
    r.valid_from.slice(0, 10),
    r.valid_to.slice(0, 10),
    r.is_current,
    r.revision,
    r.surcharges,
    r.trade_term,
    r.internal_note,
    r.local_charges,
    r.public_note,
    r.cargo_type,
    r.transit_days,
    r.service_type,
    r.schedule_ids,
  ]);
}

/** Groups in first-seen order (the input is already sorted). */
export function groupRates<T extends GroupFields>(items: T[]): T[][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = rateGroupKey(item);
    const row = groups.get(key);
    if (row) row.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.values()];
}
