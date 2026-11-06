"use client";
import { useEffect, useState, useTransition } from "react";
import { loadWorkspaceTags, saveNote } from "@/features/workspace/actions";
import { useWorkspaceAction } from "@/features/workspace/hooks/use-workspace-action";
import type { WorkspaceTag } from "@/features/workspace/types";

export function useWhiteboardNote(body: string) {
  const [tags, setTags] = useState<WorkspaceTag[]>([]);
  const [error, setError] = useState("");
  const [loading, startLoading] = useTransition();
  const { pending, run } = useWorkspaceAction();
  useEffect(() => {
    let active = true;
    startLoading(async () => {
      const result = await loadWorkspaceTags();
      if (!active) return;
      setTags(result.tags ?? []);
      setError(result.error ?? "");
    });
    return () => { active = false; };
  }, []);

  function save(form: FormData, onSaved: () => void) {
    run(async () => {
      const result = await saveNote("", { title: String(form.get("title") ?? ""), body, tag: String(form.get("tag") ?? ""), kind: "other" });
      return result.error ? result : { success: "Đã lưu bảng trắng vào ghi chú cá nhân." };
    }, onSaved);
  }

  return { tags, loading, error, pending, save };
}
