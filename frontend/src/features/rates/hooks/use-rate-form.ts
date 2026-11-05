"use client";
import { useEffect, useState, useTransition } from "react";
import { useModalDismiss } from "@/components/ui/modal-context";
import { useRateModals } from "./use-rate-modals";
import { loadTarget, saveRate } from "../actions";
import { useToast } from "@/components/feedback/toast-provider";
import { usdToCents } from "../schemas/rate-input";
import {
  containers,
  type Catalog,
  type RateInput,
  type TargetState,
} from "../types";
export function useRateForm(
  catalog: Catalog,
  initial: RateInput,
  baseline: TargetState,
) {
  const [pending, startTransition] = useTransition();
  const dismiss = useModalDismiss(),
    modals = useRateModals();
  const [route, setRoute] = useState(initial.route),
    [carrier, setCarrier] = useState(initial.carrier);
  const [target, setTarget] = useState(baseline),
    [loading, setLoading] = useState(false),
    [error, setErrorState] = useState(""),
    [conflict, setConflict] = useState(false);
  const toast = useToast();
  const setError = (message: string) => { setErrorState(message); if (message) toast(message, "error"); };
  const [mode, setMode] = useState<"row" | "route" | "default">(
    initial.lines[0]?.margin_mode || "route",
  );
  const [costs, setCosts] = useState<Record<string, string>>(
    Object.fromEntries(
      initial.lines.map((l) => [
        l.container_type,
        String(l.cost_price_cents / 100),
      ]),
    ),
  );
  const [profits, setProfits] = useState<Record<string, string>>(
    Object.fromEntries(
      initial.lines.map((l) => [
        l.container_type,
        String((l.margin_cents || 0) / 100),
      ]),
    ),
  );
  const [targetKey, setTargetKey] = useState(
    `${initial.route}/${initial.carrier}`,
  );
  useEffect(() => {
    const key = `${route}/${carrier}`;
    if (key === targetKey) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError("");
    setConflict(false);
    loadTarget(route, carrier).then((result) => {
      if (!alive) return;
      if (result.data) {
        setTarget(result.data);
        setTargetKey(key);
      } else setError(result.error);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [route, carrier, targetKey]);
  const routeMargin =
    catalog.margins.find((m) => m.route === route)?.margin_cents ??
    catalog.defaultMargin;
  const effectiveMargin =
    mode === "default" ? catalog.defaultMargin : routeMargin;
  function submit(form: FormData, again: boolean) {
    setError("");
    if (loading || targetKey !== `${route}/${carrier}` || conflict) return;
    let input: RateInput;
    try {
      input = {
        ...initial,
        route,
        carrier,
        schedule_ids:
          route === initial.route && carrier === initial.carrier
            ? initial.schedule_ids
            : [],
        valid_from: String(form.get("valid_from")),
        valid_to: String(form.get("valid_to")),
        service_type: String(
          form.get("service_type"),
        ) as RateInput["service_type"],
        transit_days: Number(form.get("transit_days")),
        trade_term: String(form.get("trade_term")),
        cargo_type: String(form.get("cargo_type")),
        surcharges: [form.get("surcharges"), form.get("other_surcharges")]
          .filter(Boolean)
          .join(" · "),
        local_charges: [
          form.get("local_charges"),
          form.get("other_local_charges"),
        ]
          .filter(Boolean)
          .join(" · "),
        public_note: String(form.get("public_note")),
        internal_note: String(form.get("internal_note")),
        lines: containers
          .filter((c) => costs[c]?.trim())
          .map((c) => ({
            container_type: c,
            cost_price_cents: usdToCents(costs[c]),
            margin_mode: mode,
            ...(mode === "row"
              ? { margin_cents: usdToCents(profits[c] || "0") }
              : {}),
            expected_revision: target.revisions[c] || 0,
          })),
      };
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    startTransition(async () => {
      const result = await saveRate(input);
      if (result.error) {
        setError(result.error);
        setConflict(!!result.conflict);
        return;
      }
      if (again) {
        toast("Đã lưu giá. Bạn có thể tiếp tục nhân bản.");
        modals.open({ kind: "editor", id: result.data!.id, duplicate: true });
      } else {
        toast("Đã lưu giá thành công.");
        dismiss();
      }
    });
  }
  return {
    route,
    setRoute,
    carrier,
    setCarrier,
    target,
    loading: loading || targetKey !== `${route}/${carrier}`,
    error,
    conflict,
    pending,
    mode,
    setMode,
    costs,
    setCosts,
    profits,
    setProfits,
    effectiveMargin,
    submit,
  };
}
