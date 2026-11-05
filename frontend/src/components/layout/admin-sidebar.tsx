import Link from "next/link";
import { LayoutDashboard, Tag, CalendarDays, Anchor, SlidersHorizontal, LayoutGrid, ExternalLink, LogOut } from 'lucide-react';
import { ShipLogo } from '@/components/ui/ship-logo';
import { logout } from '@/features/auth/actions';
import { WhiteboardButton } from '@/features/whiteboard/components/whiteboard-button';
import { HibernateButton } from '@/features/auth/components/hibernate-button';
const items = [['Dashboard', '/admin/dashboard', LayoutDashboard], ['Giá cước', '/admin/rates', Tag], ['Lịch tàu', '/admin/schedules', CalendarDays], ['Hãng tàu & cảng', '/admin/master-data', Anchor], ['Tài khoản & cài đặt', '/admin/settings', SlidersHorizontal]] as const;
export function AdminSidebar({ customerUrl, active = '/admin/dashboard' }: { customerUrl?: string; active?: string }) {
  return <aside className="admin-sidebar"><div className="sidebar-brand"><ShipLogo waves /><span>SeaLogistics</span><small>QUẢN TRỊ</small></div><nav aria-label="Điều hướng quản trị">{items.map(([label, href, Icon]) => <Link className={`nav ${href === active ? 'on' : ''}`} aria-current={href === active ? 'page' : undefined} href={href} key={href}><Icon size={18} strokeWidth={1.9} />{label}</Link>)}</nav><div className="sidebar-tools"><WhiteboardButton /><Link className={`nav ${active === '/admin/workspace' ? 'on' : ''}`} aria-current={active === '/admin/workspace' ? 'page' : undefined} href="/admin/workspace"><LayoutGrid size={18} strokeWidth={1.9} />Không gian của tôi</Link></div><div className="sidebar-bottom"><Link href={customerUrl || '/rates'} className="nav"><ExternalLink size={18} />Xem trang khách</Link><HibernateButton /><form action={logout}><button className="nav"><LogOut size={18} />Đăng xuất</button></form></div></aside>;
}
