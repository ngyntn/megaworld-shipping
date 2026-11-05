"use client";
import { StyledSelect } from "@/components/ui/styled-select";
import { ModalClose } from "@/components/ui/modal-close";
import { X, Info } from "lucide-react";
import { useRateForm } from "../hooks/use-rate-form";
import { useRateModals, type EditorRequest } from "../hooks/use-rate-modals";
import { PriceGrid } from "./price-grid";
import { RateDetailsFields } from "./rate-details-fields";
import { money } from "@/lib/format";
import type { Catalog, RateEditorData } from "../types";
const editorTitle = (request: EditorRequest) =>
  !request.id ? "Thêm dòng giá" : request.duplicate ? "Nhân bản dòng giá" : "Sửa dòng giá";
export function RateForm({
  catalog,
  request,
  data,
}: {
  catalog: Catalog;
  request: EditorRequest;
  data: RateEditorData;
}) {
  const { initial } = data;
  const modals = useRateModals();
  const title = editorTitle(request);
  const state = useRateForm(catalog, initial, data.baseline);
  const selected = catalog.routes.find((r) => r.id === state.route);
  const routeName = `${catalog.ports.find((p) => p.id === selected?.pol)?.name || "—"} → ${catalog.ports.find((p) => p.id === selected?.pod)?.name || "—"}`;
  const carrierName =
    catalog.carriers.find((c) => c.id === state.carrier)?.code || "—";
  return (
    <div className="rate-editor">
        <header className="rate-editor-header">
          <div>
            <h1>{title}</h1>
            <p>
              {carrierName} · {routeName}
            </p>
          </div>
          <ModalClose className="editor-close" aria-label="Đóng">
            <X size={20} />
          </ModalClose>
        </header>
        <form
          className="rate-editor-form"
          onSubmit={(e) => {
            e.preventDefault();
            const submitter = (e.nativeEvent as SubmitEvent)
              .submitter as HTMLButtonElement;
            state.submit(
              new FormData(e.currentTarget),
              submitter?.value === "again",
            );
          }}
        >
          <div className="rate-editor-body">
            <section className="rate-form-section first">
              <h3>Tuyến &amp; hãng tàu</h3>
              <div className="form-grid three">
                <label className="rate-field">
                  <span>POL</span>
                  <StyledSelect
                    aria-label="POL"
                    value={selected?.pol || ""}
                    onChange={(e) =>
                      state.setRoute(
                        catalog.routes.find((r) => r.pol === e.target.value)
                          ?.id || "",
                      )
                    }
                  >
                    <option value="">Chọn POL</option>
                    {catalog.ports
                      .filter((p) => catalog.routes.some((r) => r.pol === p.id))
                      .map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                  </StyledSelect>
                </label>
                <label className="rate-field">
                  <span>POD</span>
                  <StyledSelect
                    aria-label="POD"
                    value={selected?.pod || ""}
                    onChange={(e) =>
                      state.setRoute(
                        catalog.routes.find(
                          (r) =>
                            r.pol === selected?.pol && r.pod === e.target.value,
                        )?.id || "",
                      )
                    }
                  >
                    <option value="">Chọn POD</option>
                    {catalog.ports
                      .filter((p) =>
                        catalog.routes.some(
                          (r) => r.pol === selected?.pol && r.pod === p.id,
                        ),
                      )
                      .map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                  </StyledSelect>
                </label>
                <label className="rate-field">
                  <span>Hãng tàu</span>
                  <StyledSelect
                    aria-label="Hãng tàu"
                    value={state.carrier}
                    onChange={(e) => state.setCarrier(e.target.value)}
                  >
                    <option value="">Chọn hãng</option>
                    {catalog.carriers.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.code}
                      </option>
                    ))}
                  </StyledSelect>
                </label>
              </div>
              {!catalog.routes.length && (
                <p className="error-message">
                  Chưa có tuyến hoạt động. Cần cấu hình tuyến trong danh mục
                  trước khi nhập giá.
                </p>
              )}
            </section>
            <PriceGrid state={state} />
            <RateDetailsFields initial={initial} />
            {Object.keys(state.target.prices).length > 0 && (
              <div className="replacement-notice">
                <Info size={20} />
                <span>
                  Đã có giá hiện hành cho{" "}
                  <b>
                    {carrierName} · {routeName}
                  </b>{" "}
                  (
                  {Object.entries(state.target.prices)
                    .map(([c, p]) => `${c} ${money(p)}`)
                    .join(", ")}
                  ). Khi lưu, giá container được nhập chuyển thành{" "}
                  <b>lịch sử</b> và giá mới trở thành giá hiện hành. Dữ liệu cũ
                  không bị xóa.
                </span>
              </div>
            )}
            {state.conflict && <button type="button" className="btn2" disabled={modals.loading} onClick={() => modals.open(request)}>Tải lại dữ liệu giá đã thay đổi</button>}
            {initial.schedule_ids.length > 0 && (
              <p className="form-hint">
                Giữ {initial.schedule_ids.length} lịch tàu đang liên kết khi
                không đổi tuyến/hãng. Ngày hiệu lực mới cần bao gồm ETD của các
                chuyến này.
              </p>
            )}
          </div>
          <footer className="rate-editor-footer">
            <ModalClose className="btn2">
              Hủy
            </ModalClose>
            <button
              className="btn2"
              name="intent"
              value="again"
              disabled={
                state.pending ||
                state.loading ||
                state.conflict ||
                !state.route ||
                !state.carrier
              }
            >
              Lưu &amp; nhân bản tiếp
            </button>
            <button
              className="btn"
              name="intent"
              value="save"
              disabled={
                state.pending ||
                state.loading ||
                state.conflict ||
                !state.route ||
                !state.carrier
              }
            >
              {state.pending
                ? "Đang lưu…"
                : state.loading
                  ? "Đang tải giá…"
                  : "Lưu giá"}
            </button>
          </footer>
        </form>
    </div>
  );
}
