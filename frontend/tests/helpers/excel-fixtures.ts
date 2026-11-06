import type { Schedule } from "../../src/features/operations/types";
import type { RateRecord } from "../../src/features/rates/types";

export const recordId = (i: number) => String(i).padStart(15, "0");
export function schedules(count: number): Schedule[] {
  return Array.from({ length: count }, (_, i) => ({
    id: recordId(i + 1), revision: 1, vessel_name: `VESSEL ${i + 1}`, voyage: `VOY-${i + 1}`,
    etd: "2026-11-10", eta: "2026-12-01", transit_days: 21,
    service_type: i % 2 ? "transit" : "direct", transshipment_port: i % 2 ? "SINGAPORE" : "",
    status: "scheduled", departure_status: "upcoming", public_note: "", expected_revision: 1,
    route: { id: recordId(800), pol: { id: recordId(801), code: "VNSGN", name: "HO CHI MINH" }, pod: { id: recordId(802), code: "USLGB", name: "LONG BEACH" } },
    carrier: { id: recordId(900 + Math.floor(i / 4)), code: `CARRIER ${Math.floor(i / 4)}`, name: "Carrier", logoUrl: "" },
  }));
}

export function rates(count: number): RateRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    id: recordId(i + 1), series: recordId(i + 100), schedule_ids: [], revision: 1, is_current: true,
    route: recordId(800), carrier: recordId(900 + Math.floor(i / 3)), pol: "HO CHI MINH", pod: "MUNDRA",
    polCode: "VNSGN", podCode: "INMUN", carrierCode: `CARRIER ${Math.floor(i / 3)}`, carrierName: "Carrier", carrierLogoUrl: "",
    container_type: ["20GP", "40GP", "40HC"][i % 3] as RateRecord["container_type"],
    valid_from: "2026-11-01", valid_to: "2026-11-30", sell_price_cents: 222575,
    cost_price_cents: 199999, margin_cents: 22576, internal_note: "SECRET INTERNAL NOTE",
    surcharges: "incl ISOCC", trade_term: "FOB", local_charges: "", public_note: "Public note",
    cargo_type: "GENERAL CARGO", transit_days: 21, service_type: "direct", created: "2026-11-01",
  }));
}
