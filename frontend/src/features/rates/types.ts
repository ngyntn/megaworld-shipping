export const containers = ["20GP", "40GP", "40HC"] as const;
export type Container = (typeof containers)[number];
export type RateLine = {
  container_type: Container;
  cost_price_cents: number;
  margin_mode: "row" | "route" | "default";
  margin_cents?: number;
  expected_revision: number;
};
export type RateInput = {
  route: string;
  carrier: string;
  valid_from: string;
  valid_to: string;
  service_type: "direct" | "transit";
  transit_days: number;
  local_charges: string;
  surcharges: string;
  trade_term: string;
  cargo_type: string;
  public_note: string;
  internal_note: string;
  schedule_ids: string[];
  lines: RateLine[];
};
export type Catalog = {
  ports: {
    id: string;
    name: string;
    code: string;
    can_be_pol: boolean;
    can_be_pod: boolean;
  }[];
  carriers: { id: string; name: string; code: string; logoUrl: string }[];
  routes: { id: string; pol: string; pod: string }[];
  margins: { route: string; margin_cents: number }[];
  defaultMargin: number | null;
  warningDays: number;
};
export type RateRecord = {
  schedule_ids: string[];
  id: string;
  series: string;
  revision: number;
  is_current: boolean;
  route: string;
  carrier: string;
  pol: string;
  pod: string;
  polCode: string;
  podCode: string;
  carrierCode: string;
  carrierName: string;
  carrierLogoUrl: string;
  container_type: Container;
  valid_from: string;
  valid_to: string;
  sell_price_cents: number;
  cost_price_cents: number;
  margin_cents: number;
  internal_note: string;
  surcharges: string;
  trade_term: string;
  local_charges: string;
  public_note: string;
  cargo_type: string;
  transit_days: number;
  service_type: string;
  created: string;
};
export type RateList = {
  items: RateRecord[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  counts: Record<string, number>;
  today: string;
  warningDays: number;
};
export type TargetState = {
  revisions: Record<string, number>;
  prices: Record<string, number>;
};
export type ImportPreview = {
  id: string;
  status: string;
  total_rows: number;
  valid_rows: number;
  new_rows: number;
  replacement_rows: number;
  errors: { row: number; message: string }[];
  items: {
    row: number;
    action: string;
    carrier: string;
    route: string;
    container_type: string;
    cost_price_cents: number;
    margin_cents: number;
    sell_price_cents: number;
  }[];
};
export type ActionResult<T> =
  | { data: T; error?: never; conflict?: never }
  | { data?: never; error: string; conflict?: boolean };
export type RateEditorData = { initial: RateInput; baseline: TargetState };
/** What a caller asks the rates page to open. Modals never change the URL. */
export type RateModalRequest =
  | { kind: "editor"; id?: string; duplicate?: boolean }
  | { kind: "import" }
  | { kind: "history"; series: string };
