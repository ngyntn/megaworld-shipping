"use client";
import { useHibernate } from "../hooks/use-hibernate";
import { HibernateOverlay } from "./hibernate-overlay";

/** Shown for any admin URL opened while hibernated (see proxy.ts). Unlock reloads the real page in place. */
export function HibernateScreen() {
  const state = useHibernate(true);
  return (
    <main className="hibernate-page">
      <HibernateOverlay instant phase={state.phase === "closed" ? "waking" : state.phase} pin={state.pin} shake={state.shake} onType={state.type} />
    </main>
  );
}
