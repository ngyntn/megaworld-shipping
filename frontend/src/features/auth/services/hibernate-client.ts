export type WakeResult = "ok" | "wrong-pin" | "expired";

export async function requestHibernate() {
  const response = await fetch("/api/session/hibernate", { method: "POST" });
  return response.ok;
}

export async function requestWake(pin: string): Promise<WakeResult> {
  try {
    const response = await fetch("/api/session/wake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = (await response.json()) as { result?: WakeResult };
    return data.result ?? "expired";
  } catch {
    return "wrong-pin";
  }
}
