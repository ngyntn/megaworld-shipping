"use client";
import { useMemo, useState } from "react";
import type { WorkspaceEvent } from "../types";

/** The open event form: a new item on `day`, or an existing `event`. */
export type EventDraft = { day: string; event?: WorkspaceEvent };

/** Selected day, events grouped by day and the event being edited for one calendar month. */
export function useCalendar(month: string, today: string, events: WorkspaceEvent[]) {
  const [selected, setSelected] = useState(today.startsWith(month) ? today : `${month}-01`);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const byDay = useMemo(() => {
    const map = new Map<string, WorkspaceEvent[]>();
    for (const event of events) map.set(event.day, [...(map.get(event.day) ?? []), event]);
    return map;
  }, [events]);
  return {
    selected,
    select: setSelected,
    byDay,
    agenda: byDay.get(selected) ?? [],
    draft,
    create: () => setDraft({ day: selected }),
    edit: (event: WorkspaceEvent) => setDraft({ day: event.day, event }),
    closeDraft: () => setDraft(null),
  };
}
