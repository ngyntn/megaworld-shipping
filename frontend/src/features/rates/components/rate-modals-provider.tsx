"use client";
import { useEffect, useMemo } from "react";
import { ModalSurface } from "@/components/ui/modal-surface";
import { RateModalsContext, useRateModalsState } from "../hooks/use-rate-modals";
import { HistoryDialog } from "./history-dialog";
import { ImportDialog } from "./import-dialog";
import { RateForm } from "./rate-form";
import type { Catalog, RateModalRequest } from "../types";

type Props = {
  catalog: Catalog;
  /** Modal requested by another page (e.g. dashboard `?open=new`), opened once on mount. */
  initialRequest?: RateModalRequest;
  children: React.ReactNode;
};

export function RateModalsProvider({ catalog, initialRequest, children }: Props) {
  const { active, loading, open, close } = useRateModalsState();
  const api = useMemo(() => ({ open, loading }), [open, loading]);

  useEffect(() => {
    document.documentElement.classList.toggle("is-modal-loading", loading);
  }, [loading]);

  useEffect(() => {
    if (!initialRequest) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("open");
    window.history.replaceState(window.history.state, "", url);
    open(initialRequest);
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RateModalsContext value={api}>
      {children}
      {active?.kind === "editor" && (
        <ModalSurface key="editor" className="rate-editor-backdrop" label="Chỉnh sửa giá cước" onClosed={close}>
          <RateForm
            key={JSON.stringify([active.request, active.data.initial])}
            catalog={catalog}
            request={active.request}
            data={active.data}
          />
        </ModalSurface>
      )}
      {active?.kind === "import" && (
        <ModalSurface key="import" className="import-backdrop" label="Import Excel" onClosed={close}>
          <ImportDialog />
        </ModalSurface>
      )}
      {active?.kind === "history" && (
        <ModalSurface key="history" className="history-backdrop" label="Lịch sử giá" onClosed={close}>
          <HistoryDialog key={active.data.series} initial={active.data} />
        </ModalSurface>
      )}
    </RateModalsContext>
  );
}
