"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/feedback/toast-provider";
import type { Result } from "@/features/operations/types";

/** Runs a workspace server action, reports the result as a toast and reloads server data on success. */
export function useWorkspaceAction({ refresh = true }: { refresh?: boolean } = {}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  function run(action: () => Promise<Result>, onSuccess?: () => void) {
    start(async () => {
      const result = await action();
      if (result.error) return toast(result.error, "error");
      if (result.success) toast(result.success);
      onSuccess?.();
      if (refresh) router.refresh();
    });
  }
  return { pending, run };
}
