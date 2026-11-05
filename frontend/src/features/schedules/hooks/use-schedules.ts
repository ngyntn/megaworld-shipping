"use client";
import { useRef, useState, useTransition } from "react";
import { loadSchedules, saveSchedule } from "../actions";
import { useToast } from "@/components/feedback/toast-provider";
import { useConfirm } from "@/components/ui/confirm-provider";
import type {
  Schedule,
  ScheduleInput,
  SchedulePage,
  OperationsCatalog,
} from "@/features/operations/types";
export const emptySchedule: ScheduleInput = {
  route: "",
  carrier: "",
  vessel_name: "",
  voyage: "",
  etd: "",
  eta: "",
  service_type: "direct",
  transshipment_port: "",
  status: "scheduled",
  public_note: "",
  expected_revision: 0,
};
export function scheduleInput(s: Schedule): ScheduleInput {
  return {
    route: s.route.id,
    carrier: s.carrier.id,
    vessel_name: s.vessel_name,
    voyage: s.voyage,
    etd: s.etd.slice(0, 10),
    eta: s.eta.slice(0, 10),
    service_type: s.service_type,
    transshipment_port: s.transshipment_port,
    status: s.status,
    public_note: s.public_note,
    expected_revision: s.revision,
  };
}
export function useSchedules(
  initial: SchedulePage,
  catalog: OperationsCatalog,
) {
  const [list, setList] = useState(initial),
    [input, setInput] = useState({
      ...emptySchedule,
      carrier: catalog.carriers.find((c) => c.active)?.id || "",
    }),
    [editing, setEditing] = useState("");
  const [pol, setPol] = useState(""),
    [pod, setPod] = useState(""),
    [query, setQuery] = useState<Record<string, string>>({}),
    [pending, start] = useTransition();
  const toast = useToast();
  const confirm = useConfirm();
  const setError = (message: string) => { if (message) toast(message, "error"); };
  const setSuccess = (message: string) => { if (message) toast(message); };
  const request = useRef(0);
  function refresh(next = query) {
    setQuery(next);
    const n = ++request.current;
    start(async () => {
      const result = await loadSchedules(next);
      if (n !== request.current) return;
      if (result.data) setList(result.data);
      setError(result.error || "");
    });
  }
  function edit(s: Schedule) {
    setEditing(s.id);
    setInput(scheduleInput(s));
    setPol(s.route.pol.id);
    setPod(s.route.pod.id);
    setError("");
    setSuccess("");
    document.querySelector(".op-form")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function reset() {
    setEditing("");
    setInput({
      ...emptySchedule,
      carrier: catalog.carriers.find((c) => c.active)?.id || "",
    });
    setPol("");
    setPod("");
  }
  function save(another: boolean) {
    start(async () => {
      setError("");
      setSuccess("");
      let route = catalog.routes.find(
        (r) => r.pol === pol && r.pod === pod && r.active,
      )?.id;
      if (!route) {
        const { ensureRoute } = await import("@/features/master-data/actions");
        const result = await ensureRoute(pol, pod);
        if (result.error) {
          setError(result.error);
          return;
        }
        route = result.id;
      }
      const result = await saveSchedule(
        { ...input, route: route || "" },
        editing || undefined,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Đã lưu chuyến tàu.");
      if (another) reset();
      else if (result.data) {
        setEditing(result.data.id);
        setInput(scheduleInput(result.data));
      }
      refresh();
    });
  }
  async function cancel(s: Schedule) {
    if (pending || !await confirm({ title: "Hủy chuyến tàu?", description: `Chuyến ${s.vessel_name} / ${s.voyage} sẽ chuyển sang trạng thái đã hủy và không còn xuất hiện trong lịch tàu của khách.`, confirmLabel: "Hủy chuyến", destructive: true })) return;
    start(async () => {
      const result = await saveSchedule(
        { ...scheduleInput(s), status: "cancelled" },
        s.id,
      );
      if (result.error) setError(result.error);
      else {
        setSuccess("Đã hủy chuyến tàu.");
        if (editing === s.id) reset();
        refresh();
      }
    });
  }
  return {
    list,
    input,
    setInput,
    editing,
    pol,
    setPol,
    pod,
    setPod,
    pending,
    refresh,
    query,
    edit,
    reset,
    save,
    cancel,
    filter: (key: string, value: string) => {
      const next: Record<string, string> = { ...query, page: "1" };
      if (value) next[key] = value;
      else delete next[key];
      refresh(next);
    },
    filterMonth: (value: string) => {
      const next: Record<string, string> = { ...query, page: "1" };
      delete next.from;
      delete next.to;
      if (value) {
        next.from = `${value}-01`;
        next.to = `${value}-${new Date(Number(value.slice(0, 4)), Number(value.slice(5)), 0).getDate()}`;
      }
      refresh(next);
    },
  };
}
