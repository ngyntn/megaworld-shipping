"use client";
import { X } from "lucide-react";
import { ModalClose } from "@/components/ui/modal-close";
import { Pagination } from "@/components/ui/pagination";
import { money } from "@/lib/format";
import { HistoryRow } from "./history-row";
import { useRateHistory, type HistoryData } from "../hooks/use-rate-history";

export function HistoryDialog({ initial }: { initial: HistoryData }) {
  const { result, pending, load } = useRateHistory(initial);
  return <section className="history-dialog">
    <header className="import-header">
      <div><h1>Lịch sử giá</h1><p>{result.carrier} · {result.title}</p></div>
      <ModalClose className="editor-close" aria-label="Đóng"><X size={20} /></ModalClose>
    </header>
    <div className="history-body">
      <div className="history-summary">
        <div className="margin-segments">{result.containers.map(container => <button type="button" disabled={pending} className={`history-container ${container.id === result.series ? "on" : ""}`} key={container.id} onClick={() => load(container.id, 1)}>{container.label}</button>)}</div>
        <span>Giá hiện hành <strong>{result.current == null ? "—" : money(result.current)}</strong></span>
      </div>
      <div className="history-table-scroll" tabIndex={0} aria-label="Bảng lịch sử giá cuộn ngang">
        <table className="history-table" aria-busy={pending}>
          <thead><tr>{["Đợt giá", "Validity", "Giá cũ", "Giá mới", "Giá gốc + lãi", "Chênh lệch", "Lịch tàu tương ứng", "Ghi chú nội bộ", ""].map((heading, index) => <th key={index}>{heading}</th>)}</tr></thead>
          <tbody>{result.items.map(row => <HistoryRow key={row.id} row={row} />)}</tbody>
        </table>
      </div>
      <p className="form-hint">Mỗi lần cập nhật giá cho cùng tuyến, hãng và loại container, giá cũ được lưu lại thành lịch sử.</p>
    </div>
    <footer className="history-footer">
      <Pagination page={result.page} pages={result.pages} pending={pending} onPageChange={page => load(result.series, page)} />
      <ModalClose className="btn2">Đóng</ModalClose>
    </footer>
  </section>;
}
