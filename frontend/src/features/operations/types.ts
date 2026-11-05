export type Carrier = {
  id: string;
  code: string;
  name: string;
  active: boolean;
  logo: string;
  logoUrl: string;
  rateCount: number;
};
export type Port = {
  id: string;
  code: string;
  unlocode: string;
  name: string;
  country_code: string;
  region: string;
  can_be_pol: boolean;
  can_be_pod: boolean;
  active: boolean;
};
export type Route = { id: string; pol: string; pod: string; active: boolean };
export type OperationsCatalog = {
  carriers: Carrier[];
  ports: Port[];
  routes: Route[];
};
export type ScheduleInput = {
  route: string;
  carrier: string;
  vessel_name: string;
  voyage: string;
  etd: string;
  eta: string;
  service_type: string;
  transshipment_port: string;
  status: string;
  public_note: string;
  expected_revision: number;
};
export type Schedule = Omit<
  ScheduleInput,
  "route" | "carrier" | "expected_revision"
> & {
  id: string;
  revision: number;
  transit_days: number;
  departure_status: string;
  route: {
    id: string;
    pol: Pick<Port, "id" | "code" | "name">;
    pod: Pick<Port, "id" | "code" | "name">;
  };
  carrier: Pick<Carrier, "id" | "code" | "name" | "logoUrl">;
};
export type SchedulePage = {
  items: Schedule[];
  has_more: boolean;
  page: number;
  pages: number;
  total: number;
};
export type Result = { error?: string; success?: string };
export type AccountData = {
  name: string;
  email: string;
  phone: string;
  job_title: string;
  created: string;
  storefront: {
    id: string;
    slug: string;
    display_name: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    zalo_phone: string;
    business_hours: string;
    default_language: string;
  };
  settings: {
    id: string;
    default_margin_cents: number;
    expiry_warning_days: number;
  };
};
