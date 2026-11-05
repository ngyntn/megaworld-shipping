"use client";
import { useToast } from "@/components/feedback/toast-provider";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCatalog, toggleCatalog } from "../actions";
import { useConfirm } from "@/components/ui/confirm-provider";
import type { Carrier, Port, Result } from "@/features/operations/types";
export function useMasterData(first?: Carrier) {
  const [kind, setKind] = useState<"carriers" | "ports">("carriers"),
    [selected, setSelected] = useState<Carrier | Port | undefined>(first),
    [search, setSearch] = useState(""),
    [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const notify = (result: Result) => { if (result.error) toast(result.error, "error"); else if (result.success) toast(result.success); };
  function tab(next: "carriers" | "ports") {
    setKind(next);
    setSelected(undefined);
  }
  function save(form: FormData) {
    start(async () => {
      const result = await saveCatalog(kind, selected?.id || "", form);
      notify(result);
      if (!("error" in result)) router.refresh();
    });
  }
  async function toggle(id: string, active: boolean) {
    if (!active && !await confirm({ title: "Ẩn danh mục này?", description: "Hãng tàu hoặc cảng sẽ tạm ngừng hiển thị trên trang khách. Bạn có thể bật lại bất cứ lúc nào.", confirmLabel: "Ẩn danh mục" })) return;
    start(async () => {
      notify(await toggleCatalog(kind, id, active));
      router.refresh();
    });
  }
  return {
    kind,
    selected,
    setSelected,
    search,
    setSearch,
    pending,
    tab,
    save,
    toggle,
  };
}
