import { AdminHeader } from "@/components/layout/admin-header";
import { requireSession } from "@/features/auth/services/session";
import { getCatalog } from "@/features/rates/services/catalog";
import { getRates } from "@/features/rates/services/rate-list";
import { RatesList } from "@/features/rates/components/rates-list";
import { RateModalsProvider } from "@/features/rates/components/rate-modals-provider";
import type { RateModalRequest } from "@/features/rates/types";
const linkedModals: Record<string, RateModalRequest> = { new: { kind: "editor" }, import: { kind: "import" } };
export const metadata = { title: "Quản lý giá cước — SeaLogistics" };
export default async function RatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = Object.fromEntries(
    Object.entries(await searchParams).map(([k, v]) => [
      k,
      Array.isArray(v) ? v[0] : v,
    ]),
  );
  const { staff } = await requireSession();
  const [catalog, data] = await Promise.all([getCatalog(), getRates(params)]);
  return (
    <>
      <AdminHeader name={staff.name || staff.email} query={params.q} />
      <RateModalsProvider catalog={catalog} initialRequest={linkedModals[params.open || ""]}>
        <RatesList catalog={catalog} data={data} params={params} />
      </RateModalsProvider>
    </>
  );
}
