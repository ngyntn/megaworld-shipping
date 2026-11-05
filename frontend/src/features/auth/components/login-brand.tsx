import { CalendarDays, MapPin, Tag } from 'lucide-react';
import { ShipLogo } from '@/components/ui/ship-logo';
export function LoginBrand() {
  return <section className="login-brand">
    <svg className="ship-background" width="620" height="300" viewBox="0 0 620 300" fill="none" stroke="#1D4E91" strokeWidth="2" aria-hidden="true"><path d="M40 190h520l-60 70H110zM120 190v-60h360v60M150 130v-40h90v40M250 130v-40h90v40M350 130v-40h90v40M150 110h90M250 110h90M350 110h90M420 90V50h40v40M0 285c30 0 30-10 60-10s30 10 60 10 30-10 60-10 30 10 60 10 30-10 60-10 30 10 60 10 30-10 60-10 30 10 60 10 30-10 60-10 30 10 60 10" /></svg>
    <div className="login-wordmark"><ShipLogo /><span>SeaLogistics</span></div>
    <div className="login-intro"><h1>Hệ thống quản lý giá cước vận tải biển</h1><p>Cập nhật giá nhanh. Không nhầm giá cũ. Khách tự tra cứu.</p></div>
    <div className="login-features">{[[Tag, 'Giá cước'], [CalendarDays, 'Lịch tàu'], [MapPin, 'Cảng biển']].map(([Icon, label]) => { const Glyph = Icon as typeof Tag; return <div key={String(label)}><Glyph size={28} strokeWidth={1.7} />{String(label)}</div>; })}</div>
  </section>;
}
