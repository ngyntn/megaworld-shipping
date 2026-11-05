"use client";
import { useToast } from "@/components/feedback/toast-provider";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAccount } from "../actions";
import type { Result } from "@/features/operations/types";
export function useSettingsForm(kind: Parameters<typeof updateAccount>[0]) {
  const [pending, start] = useTransition(),
    [dirty, setDirty] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const notify = (result: Result) => { if (result.error) toast(result.error, "error"); else if (result.success) toast(result.success); };
  function save(form: HTMLFormElement) {
    const data = new FormData(form);
    start(async () => {
      const result = await updateAccount(kind, data);
      notify(result);
      if (!("error" in result)) {
        setDirty(false);
        if (kind === "password") form.reset();
        router.refresh();
      }
    });
  }
  return {
    pending,
    dirty,
    save,
    change: () => {
      setDirty(true);
    },
    reset: () => {
      setDirty(false);
    },
  };
}
