"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CircleAlert } from "lucide-react";
import { fieldBox, focusTarget, validationMessage } from "./validation-message";

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Tip = { box: HTMLElement; message: string; host: HTMLElement; top: number; left: number };
const HIDE_AFTER_MS = 4500;
/** Viewport position just under the field (the tip is position: fixed). */
const place = (box: HTMLElement) => {
  const rect = box.getBoundingClientRect();
  return { top: rect.bottom + 6, left: rect.left };
};

/**
 * Replaces the browser's "Please fill out this field" bubble for every form in the app:
 * the first invalid field of a submit gets a red outline and a styled Vietnamese hint,
 * cleared as soon as the user edits it. Mounted once in the root layout.
 */
export function FormValidation() {
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    let handled = false;
    let timer = 0;
    const onInvalid = (event: Event) => {
      const control = event.target as Control;
      event.preventDefault(); // no native bubble
      if (handled) return; // only the first invalid field of this submit
      handled = true;
      queueMicrotask(() => (handled = false));
      const box = fieldBox(control);
      // Inside a modal <dialog> (top layer) the tip must be rendered in that dialog to be visible.
      const host = control.closest<HTMLElement>("dialog[open]") ?? document.body;
      document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
      box.classList.add("is-invalid");
      focusTarget(control).focus({ preventScroll: true });
      box.scrollIntoView({ block: "nearest", behavior: "smooth" });
      setTip({ box, host, message: validationMessage(control, box), ...place(box) });
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setTip(null), HIDE_AFTER_MS);
    };
    const onEdit = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      // Custom selects/date pickers: resolve to their hidden control so the same box is found.
      const control = (event.target.closest(".styled-select")?.querySelector("select, input") ?? event.target) as Control;
      const box = event.target.closest<HTMLElement>(".is-invalid") ?? fieldBox(control);
      if (box.classList.contains("is-invalid")) {
        box.classList.remove("is-invalid");
        setTip((current) => (current?.box === box ? null : current));
      }
    };
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", onEdit, true);
    document.addEventListener("change", onEdit, true);
    const onPick = (event: Event) => {
      if (event.target instanceof Element && event.target.closest(".select-menu button")) onEdit(event);
    };
    document.addEventListener("click", onPick, true);
    return () => {
      document.removeEventListener("click", onPick, true);
      window.clearTimeout(timer);
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", onEdit, true);
      document.removeEventListener("change", onEdit, true);
    };
  }, []);

  // Keep the tip attached to its field while the page or a modal scrolls.
  useEffect(() => {
    if (!tip) return;
    const follow = () =>
      setTip((current) => {
        if (!current) return current;
        return { ...current, ...place(current.box) };
      });
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [tip?.box]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tip) return null;
  return createPortal(
    <div className="validation-tip" role="alert" style={{ top: tip.top, left: tip.left }}>
      <CircleAlert size={16} aria-hidden />
      {tip.message}
    </div>,
    tip.host,
  );
}
