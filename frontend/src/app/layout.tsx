import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/feedback/toast-provider';
import { ConfirmProvider } from '@/components/ui/confirm-provider';
import { FormValidation } from '@/components/feedback/form-validation';
import { DragScrollProvider } from '@/components/ui/drag-scroll-provider';
export const metadata: Metadata = { title: 'SeaLogistics — Quản trị', description: 'Hệ thống quản lý giá cước vận tải biển' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" /></head><body><ToastProvider><ConfirmProvider>{children}<FormValidation /><DragScrollProvider /></ConfirmProvider></ToastProvider></body></html>;
}
