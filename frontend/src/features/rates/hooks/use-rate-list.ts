"use client";
import { useState } from "react";
import type { RateRecord } from "../types";
import { groupRates } from "../utils";
export function useRateList(
  items: RateRecord[],
  params: Record<string, string | undefined>,
) {
  const [showCost, setShowCost] = useState(true),
    [selected, setSelected] = useState<string[]>([]);
  const rows = groupRates(items);
  const href = (values: Record<string, string>) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        (entry): entry is [string, string] => !!entry[1] && entry[0] !== "saved" && entry[0] !== "open",
      ),
    );
    for (const [k, v] of Object.entries(values)) query.set(k, v);
    return `/admin/rates?${query}`;
  };
  return { showCost, setShowCost, selected, setSelected, rows, href };
}
