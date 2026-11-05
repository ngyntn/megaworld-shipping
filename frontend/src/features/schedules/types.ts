export type ScheduleImportPreview = {
  id: string;
  status: string;
  total_rows: number;
  valid_rows: number;
  new_rows: number;
  update_rows: number;
  errors: { row: number; message: string }[];
  items: {
    row: number;
    action: "new" | "update";
    carrier: string;
    route: string;
    vessel_name: string;
    voyage: string;
    etd: string;
    eta: string;
    transit_days: number;
    service_type: "direct" | "transit";
  }[];
};
export type ScheduleImportResult<T> =
  | { data: T; error?: never; conflict?: never }
  | { data?: never; error: string; conflict?: boolean };
