"use client";
import { Moon } from "lucide-react";
import { useHibernate } from "../hooks/use-hibernate";
import { HibernateOverlay } from "./hibernate-overlay";

/** Sidebar entry "Ngủ đông": darkens the screen and locks the admin area behind a PIN. */
export function HibernateButton() {
  const state = useHibernate();
  return (
    <>
      <button type="button" className="nav" onClick={state.lock}>
        <Moon size={18} />
        Ngủ đông
      </button>
      {state.phase !== "closed" && (
        <HibernateOverlay phase={state.phase} pin={state.pin} shake={state.shake} onType={state.type} />
      )}
    </>
  );
}
