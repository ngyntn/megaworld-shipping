"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type Frame = { x: number; y: number; w: number; h: number };

const MIN_W = 360;
const MIN_H = 280;
/** How much of the window must stay on screen so it can always be grabbed again. */
const KEEP_X = 120;
const HEADER_H = 56;
const DEFAULT_W = 1080;
const DEFAULT_H = 660;

const viewport = () => ({ vw: window.innerWidth, vh: window.innerHeight });

/** Keeps size within the viewport and the header partly visible (never fully off-screen). */
function clampFrame(f: Frame): Frame {
  const { vw, vh } = viewport();
  const w = Math.min(Math.max(f.w, Math.min(MIN_W, vw)), vw);
  const h = Math.min(Math.max(f.h, Math.min(MIN_H, vh)), vh);
  const x = Math.min(Math.max(f.x, KEEP_X - w), vw - KEEP_X);
  const y = Math.min(Math.max(f.y, 0), vh - HEADER_H);
  return { x, y, w, h };
}

function initialFrame(): Frame {
  const { vw, vh } = viewport();
  const w = Math.min(DEFAULT_W, vw - 48);
  const h = Math.min(DEFAULT_H, vh - 48);
  return clampFrame({ x: (vw - w) / 2, y: (vh - h) / 2, w, h });
}

/** Drag (by a handle) and proportional-free corner resize (width + height together) for a fixed-position window. */
export function useFloatingWindow() {
  // null until mounted: window size is unknown during SSR.
  const [frame, setFrame] = useState<Frame | null>(null);
  const frameRef = useRef<Frame | null>(null);

  const apply = useCallback((next: Frame) => {
    const clamped = clampFrame(next);
    frameRef.current = clamped;
    setFrame(clamped);
  }, []);

  useEffect(() => {
    apply(initialFrame());
    const onResize = () => frameRef.current && apply(frameRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [apply]);

  const track = useCallback(
    (event: React.PointerEvent, update: (start: Frame, dx: number, dy: number) => Frame) => {
      const start = frameRef.current;
      if (!start || event.button !== 0) return;
      event.preventDefault();
      const target = event.currentTarget as HTMLElement;
      target.setPointerCapture(event.pointerId);
      const ox = event.clientX;
      const oy = event.clientY;
      const move = (e: PointerEvent) => apply(update(start, e.clientX - ox, e.clientY - oy));
      const end = () => {
        target.removeEventListener("pointermove", move);
        target.removeEventListener("pointerup", end);
        target.removeEventListener("pointercancel", end);
      };
      target.addEventListener("pointermove", move);
      target.addEventListener("pointerup", end);
      target.addEventListener("pointercancel", end);
    },
    [apply],
  );

  const dragProps = {
    onPointerDown: (event: React.PointerEvent) => {
      // Buttons in the header keep working as buttons.
      if ((event.target as HTMLElement).closest("button")) return;
      track(event, (s, dx, dy) => ({ ...s, x: s.x + dx, y: s.y + dy }));
    },
  };
  const resizeProps = {
    onPointerDown: (event: React.PointerEvent) =>
      track(event, (s, dx, dy) => {
        const { vw, vh } = viewport();
        return { ...s, w: Math.min(s.w + dx, vw - s.x), h: Math.min(s.h + dy, vh - s.y) };
      }),
  };

  return { frame, dragProps, resizeProps };
}
