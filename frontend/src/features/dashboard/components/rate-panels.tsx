import Link from "next/link";
import type { DashboardData, DashboardRate } from '../types';
import { money, shortDate, timestamp } from '../utils';
import { CarrierLogo } from '@/components/ui/carrier-logo';
function RouteLabel({ rate, validity = false }: { rate: DashboardRate; validity?: boolean }) { return <div className="route-label"><div>{rate.pol} → {rate.pod}</div><small>{rate.container_type}{validity && ` · validity đến ${shortDate(rate.valid_to)}`}</small></div>; }
function Empty() { return <p className="empty-state">Chưa có dữ liệu.</p>; }
export function RatePanels({ data, query }: { data: DashboardData; query: string }) {
  const matches = (r: { pol: string; pod: string; carrier?: string }) => `${r.pol} ${r.pod} ${r.carrier || ''}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi').trim());
  const latest = data.latest_rates.filter(matches), top = data.top_routes.filter(matches), changes = data.significant_changes.filter(matches);
  const maximum = Math.max(1, ...data.top_routes.map(r => r.searches));
  return <div className="dashboard-panels">
    <section className="card data-panel"><div className="panel-heading"><h2>Giá mới cập nhật</h2><Link href="/admin/rates">Xem tất cả →</Link></div>{latest.length ? latest.map(r => <div className="data-row latest-row" key={r.id}><CarrierLogo code={r.carrier} logoUrl={r.carrierLogoUrl} /><RouteLabel rate={r} validity /><strong className="align-right">{money(r.sell_price_cents)}</strong><small className="align-right">{timestamp(r.created)}</small></div>) : <Empty />}</section>
    <section className="card data-panel"><div className="panel-heading"><h2>Tuyến được tra nhiều nhất</h2><span>7 ngày qua</span></div>{top.length ? top.map(r => <div className="data-row top-row" key={r.route}><b className="muted">{data.top_routes.indexOf(r) + 1}</b><div className="top-route"><strong>{r.pol} → {r.pod}</strong><span className="bar-track"><span style={{ width: `${r.searches / maximum * 100}%` }} /></span></div><strong className="align-right">{r.searches.toLocaleString('vi-VN')}</strong></div>) : <Empty />}</section>
    <section className="card data-panel"><div className="panel-heading"><h2>Giá biến động lớn</h2><span>Thay đổi ≥ 10% so với đợt trước</span></div>{changes.length ? changes.map(r => <div className="data-row changes-row" key={r.id}><CarrierLogo code={r.carrier} logoUrl={r.carrierLogoUrl} /><RouteLabel rate={r} /><div className="price-change"><span>{money(r.previous_sell_price_cents ?? 0)}</span> → <b>{money(r.sell_price_cents)}</b></div><span className={`change-badge ${(r.change_cents ?? 0) > 0 ? 'increase' : 'decrease'}`}>{r.change_percent == null ? `+${money(r.change_cents ?? 0)}` : `${r.change_percent > 0 ? '▲ +' : '▼ '}${Math.round(r.change_percent)}%`}</span></div>) : <Empty />}</section>
  </div>;
}
