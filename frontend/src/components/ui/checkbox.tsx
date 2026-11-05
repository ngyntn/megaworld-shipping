import type { InputHTMLAttributes, ReactNode } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  /** Text next to the box. The whole label is clickable. */
  label?: ReactNode;
  /** "sm" for dense tables, "md" (default) for forms and toolbars. */
  size?: "sm" | "md";
  /** Extra class for the label wrapper, used for page-specific layout. */
  labelClassName?: string;
};

/** The single checkbox used across the app: same size, color and pointer cursor everywhere. */
export function Checkbox({ label, size = "md", labelClassName, className, ...input }: Props) {
  const box = (
    <input
      {...input}
      type="checkbox"
      className={["ui-checkbox", `ui-checkbox-${size}`, className].filter(Boolean).join(" ")}
    />
  );
  if (label == null) return box;
  return (
    <label className={["ui-checkbox-label", labelClassName].filter(Boolean).join(" ")}>
      {box}
      <span>{label}</span>
    </label>
  );
}
