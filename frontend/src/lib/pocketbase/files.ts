import type PocketBase from "pocketbase";
import type { RecordModel } from "pocketbase";

/**
 * Public URL of a carrier logo uploaded on the "Hãng tàu & cảng" page.
 * pb.files.getURL() silently returns "" when the record lacks collectionId/collectionName
 * (e.g. queries using `fields`), so the collection is always filled in here.
 */
export function carrierLogoUrl(pb: PocketBase, carrier: { id: string; logo?: string }) {
  if (!carrier.logo) return "";
  return pb.files.getURL({ ...carrier, collectionName: "carriers" } as RecordModel, carrier.logo);
}

/** Map carrier id and code → logo URL, for data sources that only return carrier codes or ids. */
export async function getCarrierLogos(pb: PocketBase) {
  const carriers = await pb.collection("carriers").getFullList({ fields: "id,code,logo", requestKey: null });
  const logos = new Map<string, string>();
  for (const carrier of carriers) {
    const url = carrierLogoUrl(pb, { id: carrier.id, logo: carrier.logo });
    logos.set(carrier.id, url);
    logos.set(String(carrier.code), url);
  }
  return logos;
}
