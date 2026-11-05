'use client';
import Link from "next/link";
export default function AdminError({ reset }: { reset: () => void }) { return <main className="page-feedback"><h1>Không thể tải dữ liệu</h1><p>Vui lòng kiểm tra kết nối máy chủ và thử lại.</p><button className="btn" onClick={reset}>Thử lại</button><Link href="/admin/login">Về đăng nhập</Link></main>; }
