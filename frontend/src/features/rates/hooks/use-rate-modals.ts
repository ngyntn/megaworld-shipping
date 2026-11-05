"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast-provider";
import { loadHistory, loadRateEditor } from "../actions";
import type { HistoryData } from "./use-rate-history";
import type { RateEditorData, RateModalRequest } from "../types";

export type EditorRequest = Extract<RateModalRequest, { kind: "editor" }>;
export type ActiveRateModal =
  | { kind: "editor"; request: EditorRequest; data: RateEditorData }
  | { kind: "import" }
  | { kind: "history"; data: HistoryData };

type RateModalsApi = {
  open: (request: RateModalRequest) => void;
  loading: boolean;
};
export const RateModalsContext = createContext<RateModalsApi | null>(null);
export function useRateModals() {
  const api = useContext(RateModalsContext);
  if (!api) throw new Error("useRateModals must be used inside RateModalsProvider");
  return api;
}

/**
 * Keeps the open rate modal in client state instead of the URL.
 * Data is loaded before the modal mounts, so the slide-in animation never
 * competes with network work or content swaps.
 */
export function useRateModalsState() {
  const [active, setActive] = useState<ActiveRateModal | null>(null);
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);
  const toast = useToast();

  const open = useCallback(
    async (request: RateModalRequest) => {
      const current = ++latest.current;
      if (request.kind === "import") {
        setLoading(false);
        setActive({ kind: "import" });
        return;
      }
      setLoading(true);
      if (request.kind === "editor") {
        const result = await loadRateEditor(request.id ?? null, !!request.duplicate);
        if (current !== latest.current) return;
        setLoading(false);
        if (result.data) setActive({ kind: "editor", request, data: result.data });
        else toast(result.error, "error");
        return;
      }
      const result = await loadHistory(request.series, 1);
      if (current !== latest.current) return;
      setLoading(false);
      if (result.data) setActive({ kind: "history", data: result.data });
      else toast(result.error, "error");
    },
    [toast],
  );
  const close = useCallback(() => setActive(null), []);
  return { active, loading, open, close };
}
