import "server-only";
import { requireSession } from "@/features/auth/services/session";
import type { RateInput, TargetState } from "../types";
export const vietnamToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export async function getTarget(
  route: string,
  carrier: string,
): Promise<TargetState> {
  const { pb } = await requireSession();
  const records = await pb.collection("rate_versions").getFullList({
    filter: pb.filter(
      "is_current = true && series.route = {:route} && series.carrier = {:carrier}",
      { route, carrier },
    ),
    expand: "series",
    fields: "revision,sell_price_cents,expand.series.container_type",
  });
  return {
    revisions: Object.fromEntries(
      records.map((r) => [r.expand!.series.container_type, r.revision]),
    ),
    prices: Object.fromEntries(
      records.map((r) => [r.expand!.series.container_type, r.sell_price_cents]),
    ),
  };
}
export async function getRateInput(
  id: string,
  duplicate: boolean,
): Promise<RateInput> {
  const { pb } = await requireSession();
  const input = await pb.send<RateInput>(
    `/api/megaworld/admin/rates/${encodeURIComponent(id)}/duplicate`,
    { method: "GET" },
  );
  const source = await pb.collection("rate_versions").getOne(id);
  const siblings = await pb.collection("rate_versions").getFullList({
    filter: pb.filter(
      "series.route = {:route} && series.carrier = {:carrier} && is_current = {:current} && revision = {:revision} && valid_from = {:from} && valid_to = {:to}",
      {
        route: input.route,
        carrier: input.carrier,
        current: source.is_current,
        revision: source.revision,
        from: source.valid_from,
        to: source.valid_to,
      },
    ),
  });
  const sharedFields = [
    "route",
    "carrier",
    "valid_from",
    "valid_to",
    "service_type",
    "transit_days",
    "local_charges",
    "surcharges",
    "trade_term",
    "cargo_type",
    "public_note",
    "internal_note",
  ] as const;
  async function linkedSchedules(version: string) {
    const links = await pb
      .collection("rate_schedules")
      .getFullList({
        filter: pb.filter("rate_version = {:id}", { id: version }),
        fields: "schedule",
      });
    return links.map((r) => String(r.schedule)).sort();
  }
  if (!duplicate) input.schedule_ids = await linkedSchedules(id);
  for (const sibling of siblings.filter((r) => r.id !== id)) {
    const other = await pb.send<RateInput>(
      `/api/megaworld/admin/rates/${sibling.id}/duplicate`,
      { method: "GET" },
    );
    const sameSchedules =
      duplicate ||
      JSON.stringify(await linkedSchedules(sibling.id)) ===
        JSON.stringify(input.schedule_ids);
    if (sameSchedules && sharedFields.every((key) => other[key] === input[key]))
      input.lines.push(...other.lines);
  }
  return input;
}
