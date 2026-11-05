"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { SleepingIcon } from "./sleeping-icon";
import { PIN_LENGTH, type HibernatePhase } from "../hooks/use-hibernate";

type Props = {
  phase: HibernatePhase;
  pin: string;
  shake: number;
  /** Already dark on mount (page loaded while hibernated) instead of fading in. */
  instant?: boolean;
  onType: (value: string) => void;
};

/** Full-screen dark layer in the top layer: the page behind is inert, only the PIN can be typed. */
export function HibernateOverlay({ phase, pin, shake, instant = false, onType }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const dots = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = dialog.current!;
    if (!el.open) el.showModal();
    if (instant) el.classList.add("is-dark");
    else requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-dark")));
    input.current?.focus({ preventScroll: true });
  }, [instant]);

  useEffect(() => {
    // The standalone lock page stays dark until the real page replaces it.
    if (phase === "waking" && !instant) dialog.current?.classList.remove("is-dark");
  }, [phase, instant]);

  useEffect(() => {
    if (!shake || !dots.current) return;
    dots.current.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-10px)" }, { transform: "translateX(10px)" }, { transform: "translateX(-6px)" }, { transform: "translateX(0)" }],
      { duration: 320, easing: "ease-out" },
    );
  }, [shake]);

  return (
    <dialog
      ref={dialog}
      className={`hibernate${instant ? " is-instant" : ""}`}
      aria-label="Màn hình đang khóa"
      onCancel={(e) => e.preventDefault() /* never closes: Esc and bubbled cancels are ignored */}
      onClick={() => input.current?.focus({ preventScroll: true })}
    >
      <div className="hibernate-panel">
        <SleepingIcon />
        <div className="hibernate-dots" ref={dots} aria-hidden>
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <span key={i} className={i < pin.length ? "on" : ""} />
          ))}
        </div>
        <input
          ref={input}
          className="hibernate-input"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          aria-label="Mã PIN"
          maxLength={PIN_LENGTH}
          value={pin}
          disabled={phase === "waking"}
          onChange={(e) => onType(e.target.value)}
          onBlur={() => window.setTimeout(() => input.current?.focus({ preventScroll: true }), 0)}
        />
      </div>
    </dialog>
  );
}
