import "server-only";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import { requireSession } from "@/features/auth/services/session";
export async function getRateHistory(series: string, page: number) {
 const { pb } = await requireSession();
 const source = await pb.collection("rate_series").getOne(series, { expand:"carrier,route,route.pol,route.pod" });
 const [versions, siblings] = await Promise.all([
  pb.collection("rate_versions").getFullList({ filter:pb.filter("series = {:series}",{series}), sort:"-revision" }),
  pb.collection("rate_series").getFullList({ filter:pb.filter("route = {:route} && carrier = {:carrier}",{route:source.route,carrier:source.carrier}), sort:"container_type" })
 ]);
 const pages = Math.max(1, Math.ceil(versions.length / ADMIN_PAGE_SIZE));
 page = Math.min(page, pages);
 const items = versions.slice((page-1)*ADMIN_PAGE_SIZE,page*ADMIN_PAGE_SIZE);
 const filter = items.map(r => pb.filter("rate_version = {:id}",{id:r.id})).join(" || ");
 const [costs, links] = filter ? await Promise.all([pb.collection("rate_costs").getFullList({filter}),pb.collection("rate_schedules").getFullList({filter})]) : [[],[]];
 const route = source.expand!.route;
 return {
  series, page, pages, total:versions.length, container:String(source.container_type), carrier:String(source.expand!.carrier.code),
  title:`${route.expand!.pol.name} (${route.expand!.pol.code}) → ${route.expand!.pod.name} (${route.expand!.pod.code})`,
  containers:siblings.map(s => ({ id:s.id, label:String(s.container_type) })),
  current:versions.find(r => r.is_current)?.sell_price_cents as number | undefined,
  items:items.map(r => {
   const cost = costs.find(c => c.rate_version === r.id);
   const index = versions.findIndex(v => v.id === r.id);
   const older = versions[index+1];
   return { id:r.id, revision:Number(r.revision), current:Boolean(r.is_current), created:String(r.created), from:String(r.valid_from), to:String(r.valid_to), sell:Number(r.sell_price_cents), old:older ? Number(older.sell_price_cents) : null, cost:cost ? Number(cost.cost_price_cents) : null, margin:cost ? Number(cost.margin_cents) : null, note:String(cost?.internal_note || ""), schedules:links.filter(l => l.rate_version === r.id).map(l => typeof l.snapshot === "string" ? JSON.parse(l.snapshot) : l.snapshot) as {vessel_name:string;voyage:string;etd:string;eta:string;service_type:string}[] };
  })
 };
}
