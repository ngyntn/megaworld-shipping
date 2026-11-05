'use client';
import Link from "next/link";
import { useActionState, useState } from 'react';
import { LockKeyhole, UserRound } from 'lucide-react';
import { login } from '../actions';
import { ShipLogo } from '@/components/ui/ship-logo';
import { Checkbox } from '@/components/ui/checkbox';
export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: '' });
  const [show, setShow] = useState(false);
  const [help, setHelp] = useState(false);
  return <section className="login-form-section"><form action={action} className="login-form">
    <div className="login-heading"><ShipLogo width={54} height={40} /><h2>Chào mừng trở lại</h2><p>Đăng nhập dành cho nhân viên báo giá</p></div>
    <label className="field-label">Email hoặc tên đăng nhập<span className="input-wrap"><UserRound size={18} /><input name="identity" placeholder="nhanvien@congty.vn" autoComplete="username" required maxLength={254} /></span></label>
    <label className="field-label">Mật khẩu<span className="input-wrap"><LockKeyhole size={18} /><input name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required maxLength={1024} /><button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={show}>{show ? 'Ẩn' : 'Hiện'}</button></span></label>
    <div className="login-options"><Checkbox name="remember" label="Ghi nhớ đăng nhập" /><button type="button" className="text-link" onClick={() => setHelp(!help)}>Quên mật khẩu?</button></div>
    {help && <p className="help-message" role="status">Vui lòng liên hệ quản trị viên để được cấp lại mật khẩu.</p>}
    {state.error && <p className="error-message" role="alert">{state.error}</p>}
    <button className="btn login-submit" disabled={pending}>{pending ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
    <p className="login-contact">Chưa có tài khoản? Liên hệ quản trị viên</p>
    <Link className="login-back" href="/rates">← Về trang tra giá cho khách</Link>
  </form></section>;
}
