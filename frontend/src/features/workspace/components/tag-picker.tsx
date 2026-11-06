"use client";
import { useState } from "react";
import type { WorkspaceTag } from "../types";
import { tagStyle } from "../tags";

type Props = { tags: WorkspaceTag[]; value?: string; onValueChange?: (value: string) => void };

export function TagPicker({ tags, value = "", onValueChange }: Props) {
  const [selected, setSelected] = useState(value);
  const current = tags.some(tag => tag.id === selected) ? selected : "";
  return <fieldset className="ws-tag-picker"><legend>Gắn nhãn</legend>
    <input type="hidden" name="tag" value={current} />
    <div className="ws-kinds">
      {tags.map(tag => <button key={tag.id} type="button" className="ws-kind" style={tagStyle(tag)} aria-pressed={current === tag.id} onClick={() => {
        const next = current === tag.id ? "" : tag.id;
        setSelected(next);
        onValueChange?.(next);
      }}>{tag.name}</button>)}
    </div>
    {!tags.length && <p className="ws-hint">Tạo nhãn trong phần Quản lý nhãn bên dưới lịch.</p>}
  </fieldset>;
}
