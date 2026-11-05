"use client";
import { SelectionBar } from "@/features/bulk-delete/components/selection-bar";
import { useBulkDelete } from "@/features/bulk-delete/hooks/use-bulk-delete";
import { useRowSelection } from "@/features/bulk-delete/hooks/use-row-selection";
import { ModuleHeader } from "@/features/operations/components/shared";
import { useMasterData } from "../hooks/use-master-data";
import { CatalogForm } from "./catalog-form";
import { CarriersTable } from "./carriers-table";
import { PortsTable } from "./ports-table";
import type { OperationsCatalog } from "@/features/operations/types";
export function MasterDataView({
  name,
  catalog,
}: {
  name: string;
  catalog: OperationsCatalog;
}) {
  const s = useMasterData(
    catalog.carriers.find((c) => c.code === "ONE") || catalog.carriers[0],
  );
  const lines = s.kind === "carriers";
  const filter = (v: string) =>
    v.toLowerCase().includes(s.search.toLowerCase());
  const carriers = catalog.carriers.filter((c) => filter(c.code + " " + c.name));
  const ports = catalog.ports.filter((p) => filter(`${p.name} ${p.code} ${p.unlocode} ${p.country_code}`));
  const selection = useRowSelection((lines ? carriers : ports).map((item) => item.id));
  const bulk = useBulkDelete(s.kind, () => {
    selection.clear();
    s.setSelected(undefined);
  });
  return (
    <>
      <ModuleHeader
        name={name}
        placeholder="Tìm hãng tàu hoặc cảng…"
        onSearch={s.setSearch}
      />
      <div className="op-content">
        <div className="op-title">
          <div>
            <h1>Hãng tàu & cảng</h1>
            <p>Quản lý danh mục hãng tàu, logo và cảng biển</p>
          </div>
          <button className="btn" onClick={() => s.setSelected(undefined)}>
            + Thêm {lines ? "hãng tàu" : "cảng"}
          </button>
        </div>
        <div className="op-tabs" role="tablist" aria-label="Danh mục">
          <button
            role="tab"
            aria-selected={lines}
            onClick={() => s.tab("carriers")}
          >
            Hãng tàu · {catalog.carriers.length}
          </button>
          <button
            role="tab"
            aria-selected={!lines}
            onClick={() => s.tab("ports")}
          >
            Cảng biển · {catalog.ports.length}
          </button>
        </div>
        <div className="op-columns">
          <section
            className="card op-list"
            aria-label={lines ? "Danh sách hãng tàu" : "Danh sách cảng"}
          >
            <SelectionBar
              count={selection.selected.length}
              pending={bulk.pending}
              onDelete={() =>
                bulk.remove({ ids: selection.selected, count: selection.selected.length, all: selection.allSelected })
              }
            />
            <div className="op-table-wrap catalog-table-scroll">
              {lines ? (
                <CarriersTable rows={carriers} selection={selection} pending={s.pending} onToggle={s.toggle} onEdit={s.setSelected} />
              ) : (
                <PortsTable rows={ports} selection={selection} pending={s.pending} onToggle={s.toggle} onEdit={s.setSelected} />
              )}
              {(lines ? carriers : ports).length === 0 && (
                <p className="op-empty">Không có danh mục phù hợp.</p>
              )}
            </div>
          </section>
          <CatalogForm
            key={s.kind + (s.selected?.id || "new")}
            kind={s.kind}
            selected={s.selected}
            pending={s.pending}
            save={s.save}
            cancel={() => s.setSelected(undefined)}
          />
        </div>
      </div>
    </>
  );
}
