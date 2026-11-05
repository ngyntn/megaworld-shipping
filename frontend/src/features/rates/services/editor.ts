import "server-only";
import { getCatalog } from "./catalog";
import { getRateInput, getTarget, vietnamToday } from "./queries";
import type { RateEditorData, RateInput } from "../types";

function emptyInput(route: string, carrier: string): RateInput {
  return {
    route,
    carrier,
    valid_from: vietnamToday(),
    valid_to: vietnamToday(),
    service_type: "direct",
    transit_days: 0,
    local_charges: "",
    surcharges: "",
    trade_term: "FOB",
    cargo_type: "GC",
    public_note: "",
    internal_note: "",
    schedule_ids: [],
    lines: [],
  };
}

/** Builds the initial form state and the current-price baseline for the rate editor. */
export async function getRateEditor(
  id: string | undefined,
  duplicate: boolean,
): Promise<RateEditorData> {
  let initial: RateInput;
  if (id) initial = await getRateInput(id, duplicate);
  else {
    const catalog = await getCatalog();
    initial = emptyInput(
      catalog.routes[0]?.id || "",
      catalog.carriers[0]?.id || "",
    );
  }
  const baseline = await getTarget(initial.route, initial.carrier);
  for (const line of initial.lines)
    baseline.revisions[line.container_type] = line.expected_revision;
  return { initial, baseline };
}
