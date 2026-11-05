'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ClientResponseError } from 'pocketbase';
import { createServerClient, sessionCookie } from '@/lib/pocketbase/server';
export type LoginState = { error: string };
export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const identity = String(form.get('identity') || '').trim();
  const password = String(form.get('password') || '');
  if (!identity || !password) return { error: 'Vui lòng nhập email và mật khẩu.' };
  if (identity.length > 254 || password.length > 1024) return { error: 'Thông tin đăng nhập không hợp lệ.' };
  const pb = await createServerClient();
  try {
    const result = await pb.collection('staff').authWithPassword(identity, password);
    if (!result.record.active) return { error: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.' };
    (await cookies()).set(sessionCookie, result.token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
      ...(form.get('remember') ? { maxAge: Math.max(0, Math.floor(JSON.parse(Buffer.from(result.token.split('.')[1], 'base64url').toString()).exp - Date.now() / 1000)) } : {}),
    });
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 429) return { error: 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.' };
    if (error instanceof ClientResponseError && [400, 401, 403].includes(error.status)) return { error: 'Email hoặc mật khẩu không đúng.' };
    return { error: 'Không thể kết nối máy chủ. Vui lòng thử lại sau.' };
  }
  redirect('/admin/dashboard');
}
export async function logout() {
  (await cookies()).delete(sessionCookie);
  redirect('/admin/login');
}
