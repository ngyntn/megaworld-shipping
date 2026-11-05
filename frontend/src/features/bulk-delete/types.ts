export type DeleteKind = "rates" | "schedules" | "carriers" | "ports";
export type DeleteResult = {
  deleted: number;
  /** Items kept because other data still depends on them. */
  skipped: { id: string; label: string; reason: string }[];
};
