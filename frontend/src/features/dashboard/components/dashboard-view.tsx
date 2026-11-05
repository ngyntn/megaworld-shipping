'use client';
import Link from "next/link";
import { useState } from 'react';
import { Bell, Search, Tag, TrendingUp, Check } from 'lucide-react';
import type { DashboardData } from '../types';
import { RatePanels } from './rate-panels';
import { StatCard } from './stat-card';
import { CarrierLogo } from '@/components/ui/carrier-logo';
import { shortDate } from '../utils';
export function DashboardView({ data, name }: { data: DashboardData; name: string }) {
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState(false);
  const initials = name.split(/\s+/).slice(-2).map(s => s[0]).join('').toUpperCase();
  const stats = [
    { value: data.summary.updated_last_7_days, label: 'Giá mới cập nhật', icon: Tag, tone: 'blue', chip: '7 ngày gần đây' },
    { value: data.summary.significant_changes, label: 'Giá biến động lớn', icon: TrendingUp, tone: 'red' },
    { value: data.summary.valid_rates, label: 'Dòng giá đang hiệu lực', icon: Check, tone: 'green' },
  ] as const;
  return <main className="admin-main"><header className="admin-header"><label className="header-search"><Search size={18} /><input type="search" aria-label="Tìm kiếm" placeholder="Tìm theo POL, POD, hãng tàu…" value={query} onChange={e => setQuery(e.target.value)} /></label><div className="notification-wrap"><button className="notification-button" aria-label={`Thông báo, ${data.expiring_rates.length} giá sắp hết hạn trong danh sách`} aria-expanded={notifications} onClick={() => setNotifications(!notifications)}><Bell size={22} />{data.expiring_rates.length > 0 && <span>{data.expiring_rates.length}</span>}</button>{notifications && <section className="notification-panel" aria-label="Giá sắp hết hạn"><h2>Giá sắp hết hạn</h2>{data.expiring_rates.length ? data.expiring_rates.map(r => <div className="notification-row" key={r.id}><CarrierLogo code={r.carrier} logoUrl={r.carrierLogoUrl} /><div><strong>{r.pol} → {r.pod}</strong><small>{r.container_type} · đến {shortDate(r.valid_to)}</small></div></div>) : <p className="empty-state">Không có giá sắp hết hạn.</p>}</section>}</div><div className="staff-profile"><span className="avatar">{initials || 'NV'}</span><span><b>{name}</b><small>Admin</small></span></div></header>
    <div className="dashboard-content"><div className="dashboard-title"><div><h1>Dashboard</h1><p>Tổng quan dữ liệu giá cước · hôm nay {data.today.split('-').reverse().join('/')}</p></div><div className="dashboard-actions"><Link href="/admin/rates?open=import" className="btn2">Import Excel</Link><Link href="/admin/rates?open=new" className="btn">+ Thêm giá mới</Link></div></div><div className="stats-grid">{stats.map(stat => <StatCard key={stat.label} {...stat} />)}</div>{query && <p className="search-status" role="status">Lọc dữ liệu trên dashboard theo “{query}”</p>}<RatePanels data={data} query={query} /></div>
  </main>;
}
