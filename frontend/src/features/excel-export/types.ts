export type ExportKind = "rates" | "schedules";
export type ExportScope = "selected" | "filtered";
export type ExportDetails = {
  client: string;
  contact: string;
  address: string;
  sales: string;
  quantity: number;
};
export type ExportRequest = {
  scope: ExportScope;
  ids: string[];
  filters: Record<string, string>;
  details: ExportDetails;
};

export const templateDetails: Record<ExportKind, ExportDetails> = {
  schedules: { client: "DAESANG VIET NAM CO., LTD TAY NINH BRAND", contact: "Ms.Ngan", address: "", sales: "", quantity: 1 },
  rates: { client: "KT IMEX CO., LTD", contact: "Ms. Trúc", address: "36A Street 15, Chanh Hung Ward, Ho Chi Minh City, Vietnam", sales: "Ms. Sophia", quantity: 1 },
};
