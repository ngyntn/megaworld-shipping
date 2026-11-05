import { redirect } from 'next/navigation';
import { getSession } from '@/features/auth/services/session';
import { LoginBrand } from '@/features/auth/components/login-brand';
import { LoginForm } from '@/features/auth/components/login-form';
export const metadata = { title: 'Đăng nhập quản trị — SeaLogistics' };
export default async function LoginPage() {
  if (await getSession()) redirect('/admin/dashboard');
  return <main className="login-page"><LoginBrand /><LoginForm /></main>;
}
