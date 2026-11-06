export const eventCategories = ["customer", "rate", "schedule", "other"] as const;
export type EventCategory = (typeof eventCategories)[number];
export const noteKinds = ["quote", "customer", "schedule", "reminder", "other"] as const;
export type NoteKind = (typeof noteKinds)[number];

export type WorkspaceEvent = {
  id: string;
  title: string;
  /** YYYY-MM-DD, Vietnam business day. */
  day: string;
  /** HH:MM, or "" for an all-day item. */
  time: string;
  category: EventCategory;
};

export type WorkspaceNote = {
  id: string;
  /** May be empty when the note only has a body. */
  title: string;
  body: string;
  kind: NoteKind;
};

/** Snapshot of one container price taken from the rates table. */
export type SavedQuote = {
  id: string;
  route_label: string;
  carrier_code: string;
  container_type: string;
  price_cents: number;
  valid_to: string;
  created: string;
};

export type WorkspaceData = {
  today: string;
  /** YYYY-MM shown in the calendar. */
  month: string;
  events: WorkspaceEvent[];
  notes: WorkspaceNote[];
  quotes: SavedQuote[];
};

/** One container line of a rate row, offered when saving a quote. */
export type QuoteOption = {
  id: string;
  container_type: string;
  sell_price_cents: number;
};
