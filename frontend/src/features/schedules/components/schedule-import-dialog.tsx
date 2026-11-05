"use client";
import { X, Upload } from "lucide-react";
import { ModalClose } from "@/components/ui/modal-close";
import { Pagination } from "@/components/ui/pagination";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import { useScheduleImport } from "../hooks/use-schedule-import";
import { ScheduleImportTable, buildRows } from "./schedule-import-table";
const STEPS = ["Tải file lên", "Kiểm tra dữ liệu", "Xác nhận nhập"];
export function ScheduleImportDialog({ onImported }: { onImported: () => void }) {
  const state = useScheduleImport(onImported),
    p = state.preview,
    rows = p ? buildRows(p) : [],
    current = state.done != null ? 2 : p ? 1 : 0;
  return (
    <section className="import-dialog" aria-labelledby="import-title">
      <header className="import-header">
        <h1 id="import-title">Import lịch tàu từ Excel</h1>
        <ModalClose className="editor-close" aria-label="Đóng">
          <X size={20} />
        </ModalClose>
      </header>
      <div className="import-body">
        <ol className="import-steps">
          {STEPS.map((label, i) => {
            const complete = state.done != null || (p && i === 0);
            return (
              <li
                key={label}
                className={complete ? "complete" : current === i ? "active" : ""}
                aria-current={current === i ? "step" : undefined}
              >
                <span>{complete ? "✓" : i + 1}</span>
                {label}
              </li>
            );
          })}
        </ol>
        <input
          ref={state.fileInput}
          type="file"
          accept=".xlsx"
          aria-label="Chọn file Excel"
          className="sr-only"
          disabled={state.pending}
          onChange={(e) => state.upload(e.target.files?.[0])}
        />
        <div className="import-file">
          <span className="xlsx-icon">XLSX</span>
          <div>
            <strong>{state.fileName || "Chọn lịch tàu cần nhập"}</strong>
            <small>
              {p ? `${p.total_rows} dòng · đã kiểm tra` : "Định dạng .xlsx · tối đa 2 MiB / 500 dòng"}
            </small>
          </div>
          <button
            className="text-link"
            disabled={state.pending}
            onClick={() => {
              if (state.fileInput.current) {
                state.fileInput.current.value = "";
                state.fileInput.current.click();
              }
            }}
          >
            {state.fileName ? "Đổi file" : "Chọn file"}
          </button>
          <a href="/admin/schedules/import/template">Tải file mẫu</a>
        </div>
        {!state.fileName && (
          <button
            type="button"
            className="import-dropzone"
            onClick={() => state.fileInput.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              state.upload(e.dataTransfer.files[0]);
            }}
          >
            <Upload size={32} />
            <b>Kéo thả file Excel vào đây</b>
            <span>hoặc bấm để chọn file</span>
          </button>
        )}
        {state.pending && (
          <p className="form-hint" role="status">
            {p ? "Đang xác nhận nhập…" : "Đang kiểm tra dữ liệu…"}
          </p>
        )}
        {p && (
          <>
            <div className="import-summary">
              <span className="valid">{p.new_rows} chuyến mới</span>
              <span className="neutral">{p.update_rows} chuyến đã có (cập nhật)</span>
              <span className="import-error">{p.errors.length} dòng lỗi</span>
            </div>
            <ScheduleImportTable rows={rows.slice((state.page - 1) * ADMIN_PAGE_SIZE, state.page * ADMIN_PAGE_SIZE)} />
            <Pagination page={state.page} pages={Math.ceil(rows.length / ADMIN_PAGE_SIZE)} onPageChange={state.setPage} />
          </>
        )}
      </div>
      <footer className="import-footer">
        <span>Dòng lỗi sẽ được bỏ qua. Tuyến chưa có sẽ được tạo tự động. Bạn có thể sửa file và import lại.</span>
        <div>
          <ModalClose className="btn2">{state.done != null ? "Đóng" : "Hủy"}</ModalClose>
          {state.done == null && (
            <button className="btn" disabled={!p?.valid_rows || state.pending || state.conflict} onClick={state.confirm}>
              Nhập {p?.valid_rows || 0} chuyến hợp lệ
            </button>
          )}
        </div>
      </footer>
    </section>
  );
}
