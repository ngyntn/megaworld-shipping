import "server-only";
import { cache } from "react";
import { requireSession } from "@/features/auth/services/session";
import { carrierLogoUrl } from "@/lib/pocketbase/files";
import type { Catalog } from "../types";
export const getCatalog = cache(async (): Promise<Catalog> => {
  const { pb } = await requireSession();
  const [ports, carriers, routes, settings, margins] = await Promise.all([
    pb.collection("ports").getFullList({
      filter: "active = true",
      sort: "name",
      fields: "id,name,code,can_be_pol,can_be_pod",
    }),
    pb.collection("carriers").getFullList({
      filter: "active = true",
      sort: "code",
      fields: "id,name,code,logo",
    }),
    pb
      .collection("routes")
      .getFullList({ filter: "active = true", fields: "id,pol,pod" }),
    pb.collection("staff_settings").getList(1, 1),
    pb.collection("route_margins").getFullList(),
  ]);
  return {
    ports: ports.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      can_be_pol: p.can_be_pol,
      can_be_pod: p.can_be_pod,
    })),
    carriers: carriers.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      logoUrl: carrierLogoUrl(pb, { id: c.id, logo: c.logo }),
    })),
    routes: routes.map((r) => ({ id: r.id, pol: r.pol, pod: r.pod })),
    margins: margins.map((m) => ({
      route: m.route,
      margin_cents: m.margin_cents,
    })),
    defaultMargin: settings.items[0]?.default_margin_cents ?? null,
    warningDays: settings.items[0]?.expiry_warning_days ?? 7,
  };
});
