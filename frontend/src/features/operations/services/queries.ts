import "server-only";
import { SCHEDULE_PAGE_SIZE } from "@/lib/pagination";
import { requireSession } from "@/features/auth/services/session";
import { carrierLogoUrl, getCarrierLogos } from "@/lib/pocketbase/files";
import type { OperationsCatalog, AccountData, SchedulePage } from "../types";
export async function getOperationsCatalog(): Promise<OperationsCatalog> {
  const { pb } = await requireSession();
  const [carriers, ports, routes, series] = await Promise.all([
    pb.collection("carriers").getFullList({ sort: "code" }),
    pb.collection("ports").getFullList({ sort: "-can_be_pol,name" }),
    pb.collection("routes").getFullList(),
    pb.collection("rate_series").getFullList({ fields: "carrier" }),
  ]);
  return {
    carriers: carriers.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      active: c.active,
      logo: c.logo,
      logoUrl: carrierLogoUrl(pb, { id: c.id, logo: c.logo }),
      rateCount: series.filter((s) => s.carrier === c.id).length,
    })),
    ports: ports.map((p) => ({
      id: p.id,
      code: p.code,
      unlocode: p.unlocode,
      name: p.name,
      country_code: p.country_code,
      region: p.region,
      can_be_pol: p.can_be_pol,
      can_be_pod: p.can_be_pod,
      active: p.active,
    })),
    routes: routes.map((r) => ({
      id: r.id,
      pol: r.pol,
      pod: r.pod,
      active: r.active,
    })),
  };
}
export async function getSchedules(
  query: Record<string, string> = {},
): Promise<SchedulePage> {
  const { pb } = await requireSession();
  const result = await pb.send<SchedulePage>("/api/megaworld/admin/schedules", {
    query: { ...query, per_page: SCHEDULE_PAGE_SIZE },
  });
  if (result.page > result.pages) return getSchedules({ ...query, page: String(result.pages) });
  const logos = await getCarrierLogos(pb);
  return { ...result, items: result.items.map((schedule) => ({ ...schedule, carrier: { ...schedule.carrier, logoUrl: logos.get(schedule.carrier.id) || "" } })) };
}
export async function getAccount(): Promise<AccountData> {
  const { pb, staff } = await requireSession();
  const [stores, settings] = await Promise.all([
    pb.collection("storefronts").getList(1, 1),
    pb.collection("staff_settings").getList(1, 1),
  ]);
  const s = stores.items[0],
    c = settings.items[0];
  return {
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    job_title: staff.job_title,
    created: staff.created,
    storefront: {
      id: s?.id || "",
      slug: s?.slug || "",
      display_name: s?.display_name || "",
      contact_name: s?.contact_name || "",
      contact_email: s?.contact_email || "",
      contact_phone: s?.contact_phone || "",
      zalo_phone: s?.zalo_phone || "",
      business_hours: s?.business_hours || "",
      default_language: s?.default_language || "vi",
    },
    settings: {
      id: c?.id || "",
      default_margin_cents: c?.default_margin_cents ?? 0,
      expiry_warning_days: c?.expiry_warning_days ?? 7,
    },
  };
}
