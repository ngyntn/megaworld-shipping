"use client";

import { useRef, useState, useTransition } from "react";
import { loadHistory } from "../actions";
import type { getRateHistory } from "../services/history";
import { useToast } from "@/components/feedback/toast-provider";

export type HistoryData = Awaited<ReturnType<typeof getRateHistory>>;
export function useRateHistory(initial: HistoryData) {
  const [result, setResult] = useState(initial);
  const [pending, start] = useTransition();
  const request = useRef(0);
  const toast = useToast();
  function load(series: string, page: number) {
    const current = ++request.current;
    start(async () => {
      const response = await loadHistory(series, page);
      if (current !== request.current) return;
      if (response.error) { toast(response.error, "error"); return; }
      if (response.data) {
        setResult(response.data);
      }
    });
  }
  return { result, pending, load };
}
