"use client";
import { Children, isValidElement, useId, useRef, useState } from "react";
import type { SelectHTMLAttributes, ReactElement } from "react";
import { Check, ChevronDown } from "lucide-react";
type Option = { value: string; label: string };
type Props = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options?: Option[]; onValueChange?: (value: string) => void };
export function StyledSelect({ label, options, children, value, defaultValue, onValueChange, onChange, name, ...props }: Props) {
 const [local, setLocal] = useState(String(defaultValue ?? ""));
 const [open, setOpen] = useState(false);
 const id = useId(); const ref = useRef<HTMLSelectElement>(null);
 const list: Option[] = options || Children.toArray(children).flatMap(child => {
  if (!isValidElement(child)) return [];
  const p = (child as ReactElement<{ value?: string; children?: React.ReactNode }>).props;
  if (child.type === "option") return [{ value: String(p.value ?? p.children ?? ""), label: Children.toArray(p.children).join("") }];
  return [];
 });
 const selected = String(value ?? local);
 function pick(next: string) { setLocal(next); onValueChange?.(next); if (ref.current) { ref.current.value = next; ref.current.dispatchEvent(new Event("change", { bubbles: true })); } setOpen(false); }
 return <div className="styled-select" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }} onKeyDown={e => { if(e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); setOpen(false); } if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (!open) setOpen(true); else { const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]')); const index = buttons.indexOf(document.activeElement as HTMLButtonElement); buttons[(index + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus(); } } }}>
  <select {...props} ref={ref} name={name} value={selected} onChange={event => { setLocal(event.target.value); onChange?.(event); }} hidden aria-hidden="true" tabIndex={-1}>{list.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
  <button type="button" className="select-trigger" aria-label={label || props["aria-label"] || name} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} disabled={props.disabled} onClick={() => setOpen(!open)}>{label && <span className="select-label">{label}</span>}<span className="select-value">{list.find(o => o.value === selected)?.label || selected}<ChevronDown size={16}/></span></button>
  {open && <div id={id} role="listbox" aria-label={label || props["aria-label"] || name} className="select-menu">{list.map(o => <button key={o.value} type="button" role="option" aria-selected={o.value === selected} className={o.value === selected ? "on" : ""} onClick={() => pick(o.value)}>{o.label}{o.value === selected && <Check size={16}/>}</button>)}</div>}
 </div>;
}
