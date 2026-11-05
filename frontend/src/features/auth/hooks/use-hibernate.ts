"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestHibernate, requestWake } from "../services/hibernate-client";

export const PIN_LENGTH = 6;
const FADE_OUT_MS = 450;

/** closed → (lock) → locked → (correct PIN) → waking → closed */
export type HibernatePhase = "closed" | "locked" | "waking";

export function useHibernate(initiallyLocked = false) {
  const router = useRouter();
  const [phase, setPhase] = useState<HibernatePhase>(initiallyLocked ? "locked" : "closed");
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(0);
  const checking = useRef(false);

  const lock = useCallback(() => {
    setPin("");
    setPhase("locked"); // overlay first, instantly — the request runs behind it
    requestHibernate().then((ok) => {
      if (!ok) window.location.assign("/admin/login");
    });
  }, []);

  const submit = useCallback(
    async (value: string) => {
      if (checking.current) return;
      checking.current = true;
      const result = await requestWake(value);
      checking.current = false;
      if (result === "ok") {
        setPhase("waking");
        router.refresh();
        window.setTimeout(() => {
          setPhase("closed");
          setPin("");
        }, FADE_OUT_MS);
        return;
      }
      if (result === "expired") {
        window.location.assign("/admin/login");
        return;
      }
      setShake((n) => n + 1);
      setPin("");
    },
    [router],
  );

  const type = useCallback(
    (raw: string) => {
      const next = raw.replace(/\D/g, "").slice(0, PIN_LENGTH);
      setPin(next);
      if (next.length === PIN_LENGTH) submit(next);
    },
    [submit],
  );

  return { phase, pin, shake, lock, type };
}
