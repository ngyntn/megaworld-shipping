"use client";
import { useMemo, useState } from "react";

/** Checkbox selection for the rows currently shown; ids no longer visible are dropped automatically. */
export function useRowSelection(visibleIds: string[]) {
  const [picked, setPicked] = useState<string[]>([]);
  const key = visibleIds.join(",");
  const selected = useMemo(() => picked.filter((id) => visibleIds.includes(id)), [picked, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const allSelected = visibleIds.length > 0 && selected.length === visibleIds.length;
  return {
    selected,
    allSelected,
    isSelected: (id: string) => selected.includes(id),
    toggle: (id: string, on: boolean) =>
      setPicked((current) => (on ? [...current.filter((x) => x !== id), id] : current.filter((x) => x !== id))),
    toggleAll: (on: boolean) => setPicked(on ? visibleIds : []),
    clear: () => setPicked([]),
  };
}
