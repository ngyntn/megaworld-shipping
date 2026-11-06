"use client";
import { useConfirm } from "@/components/ui/confirm-provider";
import { deleteWorkspaceItem } from "../actions";
import { useWorkspaceAction } from "./use-workspace-action";

type Kind = Parameters<typeof deleteWorkspaceItem>[0];
type Prompt = { title: string; description: string };

/** Asks for confirmation, then deletes one personal workspace record. */
export function useDeleteItem(kind: Kind, prompt: Prompt) {
  const confirm = useConfirm();
  const { pending, run } = useWorkspaceAction();
  async function remove(id: string, onDeleted?: () => void) {
    if (!(await confirm({ ...prompt, confirmLabel: "Xóa", destructive: true }))) return;
    run(() => deleteWorkspaceItem(kind, id), onDeleted);
  }
  return { pending, remove };
}
