import type { CSSProperties } from "react";
import type { WorkspaceTag } from "./types";

export const tagColors = {
  blue: { label: "Xanh dương", fill: "#e8f1ff", ink: "#315f9c", dot: "#3478eb" },
  sky: { label: "Xanh trời", fill: "#e4f5fc", ink: "#286981", dot: "#0ea5e9" },
  teal: { label: "Xanh ngọc", fill: "#e1f4ef", ink: "#287563", dot: "#14b8a6" },
  green: { label: "Xanh lá", fill: "#eaf5e4", ink: "#4c7337", dot: "#38a641" },
  yellow: { label: "Vàng", fill: "#fff6d9", ink: "#86691b", dot: "#eab308" },
  orange: { label: "Cam", fill: "#ffecde", ink: "#9a5b30", dot: "#f97316" },
  rose: { label: "Hồng", fill: "#fce7ee", ink: "#9a4e68", dot: "#ec4899" },
  purple: { label: "Tím", fill: "#efe8fc", ink: "#705298", dot: "#a855f7" },
  lavender: { label: "Tím nhạt", fill: "#ececfc", ink: "#5f6196", dot: "#7775ed" },
  gray: { label: "Xám", fill: "#edf1f6", ink: "#53647b", dot: "#7b8ca3" },
} as const;
export type TagColor = keyof typeof tagColors;
export function tagStyle(tag?: WorkspaceTag): CSSProperties {
  const color = tagColors[tag?.color ?? "gray"] ?? tagColors.gray;
  return { "--ws-fill": color.fill, "--ws-ink": color.ink, "--ws-dot": color.dot } as CSSProperties;
}
