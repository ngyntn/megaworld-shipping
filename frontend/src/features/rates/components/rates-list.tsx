"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { StyledSelect } from "@/components/ui/styled-select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Pagination } from "@/components/ui/pagination";
import { Upload } from "lucide-react";
import type { Catalog, RateList } from "../types";
import { useRateList } from "../hooks/use-rate-list";
import { RatesTable } from "./rates-table";
import { useRateModals } from "../hooks/use-rate-modals";
import { SelectionBar } from "@/features/bulk-delete/components/selection-bar";
import { useBulkDelete } from "@/features/bulk-delete/hooks/use-bulk-delete";
type Props = {
  catalog: Catalog;
  data: RateList;
  params: Record<string, string | undefined>;
};
export function RatesList({ catalog, data, params }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const filter = (key: string, value: string) => startTransition(() => router.push(state.href({ [key]: value, page: "1" }), { scroll: false }));
  const state = useRateList(data.items, params);
  const modals = useRateModals();
  const { showCost, setShowCost, selected, setSelected, href } = state;
  const bulk = useBulkDelete("rates", () => setSelected([]));
  // Rows (groups of container lines) that are selected and still shown on this page.
  const chosen = state.rows.filter((group) => selected.includes(group[0].id));
  const { pageSize } = data;
  const tabs = [
    ["current", "Hiện hành"],
    ["soon", "Sắp hết hạn"],
    ["expired", "Hết hạn"],
    ["history", "Lịch sử"],
    ["all", "Tất cả"],
  ];
  return (
    <main className="rates-content">
      <div className="dashboard-title">
        <div>
          <h1>Quản lý giá cước</h1>
          <p>
            Nhập giá gốc + lợi nhuận → hệ thống tính giá bán. Khách chỉ thấy giá
            bán.
          </p>
        </div>
        <div className="dashboard-actions">
          <button type="button" className="btn2" onClick={() => modals.open({ kind: "import" })}>
            <Upload size={16} />
            Import Excel
          </button>
          <button type="button" className="btn" disabled={modals.loading} onClick={() => modals.open({ kind: "editor" })}>
            + Thêm dòng giá
          </button>
        </div>
      </div>
      <section className="card rates-card" aria-label="Danh sách giá">
        <nav className="rate-tabs" aria-label="Trạng thái giá">
          {tabs.map(([key, label]) => (
            <Link
              key={key}
              className={`rate-tab ${(params.tab || "current") === key ? "on" : ""}`}
              aria-current={
                (params.tab || "current") === key ? "page" : undefined
              }
              href={href({ tab: key, page: "1" })}
            >
              {label}
              {key !== "all" &&
                ` · ${data.counts[key].toLocaleString("vi-VN")}`}
            </Link>
          ))}
          <Checkbox labelClassName="cost-toggle" checked={showCost} onChange={e => setShowCost(e.target.checked)} label={<>Hiện giá gốc &amp; lợi nhuận</>} />
        </nav>
        <form className="rate-filters" action="/admin/rates">
          <input type="hidden" name="tab" value={params.tab || "current"} />
          {params.q && <input type="hidden" name="q" value={params.q} />}
          {[
            ["pol", "POL"],
            ["pod", "POD"],
            ["carrier", "Hãng tàu"],
          ].map(([key, label]) => (
            <StyledSelect key={key} label={label} value={params[key] || ""} onValueChange={value => filter(key, value)} options={[{ value: "", label: `Tất cả ${label}` }, ...(key === "carrier" ? catalog.carriers.map(c => ({ value: c.id, label: c.code })) : catalog.ports.filter(p => key === "pol" ? p.can_be_pol : p.can_be_pod).map(p => ({ value: p.id, label: p.name })))]} />
          ))}
          <DatePicker label="Validity" mode="month" name="month" value={params.month || ""} onValueChange={value => filter("month", value)} />
        </form>
        <SelectionBar
          count={chosen.length}
          scope="trên trang này"
          pending={bulk.pending}
          onDelete={() =>
            bulk.remove({
              ids: chosen.flat().map((line) => line.id),
              count: chosen.length,
              all: chosen.length === state.rows.length,
            })
          }
        />
        <RatesTable data={data} state={state} />
        <footer className="rates-pagination">
          <span>
            Hiển thị {data.total ? (data.page - 1) * pageSize + 1 : 0}–
            {Math.min(data.page * pageSize, data.total)} / {data.total} dòng giá
            · giá hết hạn tự đổi trạng thái theo ngày
          </span>
          <Pagination page={data.page} pages={data.pages} pending={pending} href={page => href({ page: String(page) })} />
        </footer>
      </section>
    </main>
  );
}
