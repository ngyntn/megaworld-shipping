import "server-only";
import type PocketBase from "pocketbase";
import type { RecordModel } from "pocketbase";
import { RATE_PAGE_SIZE } from "@/lib/pagination";
import { requireSession } from "@/features/auth/services/session";
import { getCatalog } from "./catalog";
import { vietnamToday } from "./queries";
import { groupRates, type GroupFields } from "../utils";
import type { RateList, RateRecord } from "../types";

const TABS = ["current", "soon", "expired", "history", "all"] as const;
type Tab = (typeof TABS)[number];
const day = (value: string) => String(value).slice(0, 10);

/** Filters shared by every tab (POL/POD/carrier/search/month). */
function baseFilter(pb: PocketBase, params: Record<string, string | undefined>) {
  const conditions: string[] = [];
  for (const [key, field] of [
    ["pol", "series.route.pol"],
    ["pod", "series.route.pod"],
    ["carrier", "series.carrier"],
  ] as const)
    if (params[key]) conditions.push(pb.filter(`${field} = {:value}`, { value: params[key] }));
  if (params.q?.trim())
    conditions.push(
      pb.filter(
        "(series.carrier.code ~ {:q} || series.carrier.name ~ {:q} || series.route.pol.name ~ {:q} || series.route.pod.name ~ {:q})",
        { q: params.q.trim().slice(0, 200) },
      ),
    );
  if (/^\d{4}-\d{2}$/.test(params.month || "")) {
    const [y, m] = params.month!.split("-").map(Number);
    const start = `${params.month}-01`;
    const end = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
    conditions.push(pb.filter("valid_from <= {:end} && valid_to >= {:start}", { start, end }));
  }
  return conditions.join(" && ");
}

/** Which tabs a price row belongs to (all its container lines share these fields). */
/**
 * Which tabs a price row belongs to — the same rules as its status badge in the table:
 * an older revision → "Lịch sử"; a latest revision whose validity has ended → "Hết hạn" only;
 * otherwise "Hiện hành" (also "Sắp hết hạn" when it ends within the warning window).
 */
function tabsOf(r: { is_current: boolean; valid_from: string; valid_to: string }, today: string, until: string): Tab[] {
  if (!r.is_current) return ["history", "all"];
  const from = day(r.valid_from), to = day(r.valid_to);
  if (to < today) return ["expired", "all"];
  const tabs: Tab[] = ["current", "all"];
  if (from <= today && to <= until) tabs.push("soon");
  return tabs;
}

type Line = GroupFields & { id: string };

/** Tab counts, pages and the table rows are all in "dòng giá" (grouped rows), not container lines. */
export async function getRates(params: Record<string, string | undefined>): Promise<RateList> {
  const { pb } = await requireSession();
  const catalog = await getCatalog();
  const today = vietnamToday();
  const until = new Date(Date.parse(today) + catalog.warningDays * 86400000).toISOString().slice(0, 10);
  const tab: Tab = (TABS as readonly string[]).includes(params.tab || "") ? (params.tab as Tab) : "current";

  // 1. Every matching container line with just the fields needed to group rows.
  const [versions, costs, links] = await Promise.all([
    pb.collection("rate_versions").getFullList({
      filter: baseFilter(pb, params),
      sort: "-created,-revision,id",
      expand: "series",
      fields:
        "id,is_current,revision,valid_from,valid_to,surcharges,trade_term,local_charges,public_note,cargo_type,transit_days,service_type,expand.series.route,expand.series.carrier",
      requestKey: null,
    }),
    pb.collection("rate_costs").getFullList({ fields: "rate_version,cost_price_cents,margin_cents,internal_note", requestKey: null }),
    pb.collection("rate_schedules").getFullList({ fields: "rate_version,schedule", requestKey: null }),
  ]);
  const costOf = new Map(costs.map((c) => [String(c.rate_version), c]));
  const schedulesOf = new Map<string, string[]>();
  for (const link of links) {
    const list = schedulesOf.get(String(link.rate_version)) ?? [];
    list.push(String(link.schedule));
    schedulesOf.set(String(link.rate_version), list);
  }
  const lines: Line[] = versions.map((r) => ({
    id: r.id,
    route: String(r.expand?.series?.route ?? ""),
    carrier: String(r.expand?.series?.carrier ?? ""),
    valid_from: day(r.valid_from),
    valid_to: day(r.valid_to),
    is_current: Boolean(r.is_current),
    revision: Number(r.revision),
    surcharges: r.surcharges,
    trade_term: r.trade_term,
    internal_note: String(costOf.get(r.id)?.internal_note || ""),
    local_charges: r.local_charges,
    public_note: r.public_note,
    cargo_type: r.cargo_type,
    transit_days: r.transit_days,
    service_type: r.service_type,
    schedule_ids: (schedulesOf.get(r.id) ?? []).sort(),
  }));

  // 2. Count and page by rows.
  const rows = groupRates(lines);
  const counts = Object.fromEntries(TABS.map((t) => [t, 0])) as Record<Tab, number>;
  const inTab: Line[][] = [];
  for (const row of rows) {
    const tabs = tabsOf(row[0], today, until);
    for (const t of tabs) counts[t]++;
    if (tabs.includes(tab)) inTab.push(row);
  }
  const pageSize = tab === "all" ? 9 : RATE_PAGE_SIZE;
  const pages = Math.max(1, Math.ceil(inTab.length / pageSize));
  const page = Math.min(pages, Math.max(1, Number.parseInt(params.page || "1", 10) || 1));
  const pageLines = inTab.slice((page - 1) * pageSize, page * pageSize).flat();

  // 3. Full details only for the lines shown on this page.
  const details = pageLines.length
    ? await pb.collection("rate_versions").getFullList({
        filter: pageLines.map((l) => pb.filter("id = {:id}", { id: l.id })).join(" || "),
        expand: "series,series.route,series.carrier,series.route.pol,series.route.pod",
        requestKey: null,
      })
    : [];
  const byId = new Map(details.map((r) => [r.id, r]));
  const items = pageLines.flatMap((line): RateRecord[] => {
    const r = byId.get(line.id);
    return r ? [toRecord(r, line, costOf.get(line.id), catalog.carriers)] : [];
  });

  return { items, total: inTab.length, pages, page, pageSize, counts, today, warningDays: catalog.warningDays };
}

function toRecord(
  r: RecordModel,
  line: Line,
  cost: RecordModel | undefined,
  carriers: { id: string; logoUrl: string }[],
): RateRecord {
  const series = r.expand!.series as RecordModel;
  const route = series.expand!.route as RecordModel;
  const pol = route.expand!.pol as RecordModel;
  const pod = route.expand!.pod as RecordModel;
  const carrier = series.expand!.carrier as RecordModel;
  return {
    id: r.id,
    schedule_ids: line.schedule_ids,
    series: r.series,
    revision: r.revision,
    is_current: r.is_current,
    sell_price_cents: r.sell_price_cents,
    surcharges: r.surcharges,
    trade_term: r.trade_term,
    local_charges: r.local_charges,
    public_note: r.public_note,
    cargo_type: r.cargo_type,
    transit_days: r.transit_days,
    service_type: r.service_type,
    created: r.created,
    route: route.id,
    carrier: carrier.id,
    pol: pol.name,
    pod: pod.name,
    polCode: pol.code,
    podCode: pod.code,
    carrierCode: carrier.code,
    carrierName: carrier.name,
    carrierLogoUrl: carriers.find((item) => item.id === carrier.id)?.logoUrl || "",
    container_type: series.container_type,
    valid_from: line.valid_from,
    valid_to: line.valid_to,
    cost_price_cents: cost?.cost_price_cents ?? 0,
    margin_cents: cost?.margin_cents ?? 0,
    internal_note: line.internal_note,
  };
}
