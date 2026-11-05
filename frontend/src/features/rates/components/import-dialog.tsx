"use client";
import { ModalClose } from "@/components/ui/modal-close";
import { X, Upload } from "lucide-react";
import { money } from "@/lib/format";
import { useImport } from "../hooks/use-import";
import { Pagination } from "@/components/ui/pagination";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
export function ImportDialog() {
  const state = useImport(),
    p = state.preview;
  const rows = [
    ...(p?.items.map((r) => ({ ...r, message: "" })) || []),
    ...(p?.errors.map((e) => ({
      row: e.row,
      message: e.message,
      action: "error",
      carrier: "—",
      route: "—",
      container_type: "",
      cost_price_cents: null,
      margin_cents: null,
      sell_price_cents: null,
    })) || []),
  ].sort((a, b) => a.row - b.row);
  return (
      <section className="import-dialog" aria-labelledby="import-title">
        <header className="import-header">
          <h1 id="import-title">Import giá cước từ Excel</h1>
          <ModalClose className="editor-close" aria-label="Đóng">
            <X size={20} />
          </ModalClose>
        </header>
        <div className="import-body">
          <ol className="import-steps">
            {["Tải file lên", "Kiểm tra dữ liệu", "Xác nhận nhập"].map(
              (label, i) => (
                <li
                  key={label}
                  className={
                    state.done != null || (p && i === 0)
                      ? "complete"
                      : (p ? 1 : 0) === i
                        ? "active"
                        : ""
                  }
                  aria-current={
                    (state.done != null ? 2 : p ? 1 : 0) === i
                      ? "step"
                      : undefined
                  }
                >
                  <span>
                    {state.done != null || (p && i === 0) ? "✓" : i + 1}
                  </span>
                  {label}
                </li>
              ),
            )}
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
              <strong>{state.fileName || "Chọn bảng giá cần nhập"}</strong>
              <small>
                {p
                  ? `${p.total_rows} dòng · đã kiểm tra`
                  : "Định dạng .xlsx · tối đa 2 MiB / 500 dòng"}
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
            <a href="/admin/rates/import/template">Tải file mẫu</a>
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
                <span className="valid">{p.new_rows} dòng mới</span>
                <span className="neutral">
                  {p.replacement_rows} dòng thay giá hiện hành (giá cũ → lịch
                  sử)
                </span>
                <span className="import-error">{p.errors.length} dòng lỗi</span>
              </div>
              <div className="import-table-scroll">
                <table className="import-table">
                  <thead>
                    <tr>
                      {[
                        "Dòng",
                        "Hãng",
                        "Tuyến",
                        "Cont",
                        "Giá gốc",
                        "Lãi",
                        "Giá bán",
                        "Kết quả kiểm tra",
                      ].map((t) => (
                        <th key={t}>{t}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice((state.page - 1) * ADMIN_PAGE_SIZE, state.page * ADMIN_PAGE_SIZE).map((r) => (
                      <tr
                        key={r.row}
                        className={r.message ? "expired-row" : ""}
                      >
                        <td>#{r.row}</td>
                        <td>
                          <b>{r.carrier}</b>
                        </td>
                        <td>{r.route}</td>
                        <td>{r.container_type || "—"}</td>
                        <td>
                          {r.cost_price_cents == null
                            ? "—"
                            : money(r.cost_price_cents)}
                        </td>
                        <td>
                          {r.margin_cents == null ? "—" : money(r.margin_cents)}
                        </td>
                        <td>
                          <b>
                            {r.sell_price_cents == null
                              ? "—"
                              : money(r.sell_price_cents)}
                          </b>
                        </td>
                        <td>
                          <span
                            className={`import-result ${r.message ? "import-error" : r.action === "new" ? "valid" : "neutral"}`}
                          >
                            {r.message ||
                              (r.action === "new"
                                ? "Mới"
                                : "Thay giá hiện hành")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={state.page} pages={Math.ceil(rows.length / ADMIN_PAGE_SIZE)} onPageChange={state.setPage} />
            </>
          )}
        </div>
        <footer className="import-footer">
          <span>
            Dòng lỗi sẽ được bỏ qua. Bạn có thể sửa file và import lại.
          </span>
          <div>
            <ModalClose className="btn2">
              {state.done != null ? "Đóng" : "Hủy"}
            </ModalClose>
            {state.done == null && (
              <button
                className="btn"
                disabled={!p?.valid_rows || state.pending || state.conflict}
                onClick={state.confirm}
              >
                Nhập {p?.valid_rows || 0} dòng hợp lệ
              </button>
            )}
          </div>
        </footer>
      </section>
  );
}
