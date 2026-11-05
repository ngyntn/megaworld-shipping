"use client";
import { useState } from "react";
import { Field } from "@/features/operations/components/shared";
import { useSettingsForm } from "../hooks/use-settings-form";
import type { AccountData } from "@/features/operations/types";
export function ProfileSettings({ account: a }: { account: AccountData }) {
  const s = useSettingsForm("profile");
  const [email, setEmail] = useState(a.email);
  return (
    <section className="card">
      <div className="settings-summary">
        <span className="avatar">
          {a.name
            .split(" ")
            .slice(-2)
            .map((n) => n[0])
            .join("")}
        </span>
        <div style={{ flex: 1 }}>
          <strong>{a.name}</strong>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>
            {a.email}
          </p>
        </div>
        <span className="op-badge">Admin</span>
        <span className="op-badge green">Hoạt động</span>
      </div>
      <div className="settings-meta">
        <div>
          <small>Vai trò</small>
          <b>Admin</b>
        </div>
        <div>
          <small>Ngày tạo tài khoản</small>
          <b>
            {a.created
              ? new Date(a.created).toLocaleDateString("vi-VN", {
                  timeZone: "Asia/Ho_Chi_Minh",
                })
              : "—"}
          </b>
        </div>
        <div>
          <small>Đăng nhập gần nhất</small>
          <b>Chưa có dữ liệu</b>
        </div>
      </div>
      <form
        className="settings-card settings-profile"
        onChange={s.change}
        onReset={() => {
          s.reset();
          setEmail(a.email);
        }}
        onSubmit={(e) => {
          e.preventDefault();
          s.save(e.currentTarget);
        }}
      >
        <h2>Cập nhật thông tin</h2>
        <div className="op-grid">
          <Field label="Họ và tên">
            <input name="name" required maxLength={120} defaultValue={a.name} />
          </Field>
          <Field label="Chức vụ">
            <input
              name="job_title"
              maxLength={120}
              defaultValue={a.job_title}
            />
          </Field>
          <Field label="Email đăng nhập">
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Số điện thoại">
            <input
              name="phone"
              type="tel"
              maxLength={40}
              defaultValue={a.phone}
            />
          </Field>
        </div>
        {email !== a.email && (
          <Field label="Mật khẩu hiện tại để đổi email">
            <input
              name="oldPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
        )}
        <div className="op-actions">
          <button className="btn" disabled={s.pending || !s.dirty}>
            Lưu thay đổi
          </button>
          <button
            type="reset"
            className="btn2"
            disabled={s.pending || !s.dirty}
          >
            Hủy thay đổi
          </button>
        </div>
        {s.dirty && <small>Có thay đổi chưa lưu</small>}
      </form>
    </section>
  );
}
export function PasswordSettings() {
  const s = useSettingsForm("password");
  return (
    <form
      className="card settings-card"
      onChange={s.change}
      onSubmit={(e) => {
        e.preventDefault();
        s.save(e.currentTarget);
      }}
    >
      <div>
        <h2>Đổi mật khẩu</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Mật khẩu mới tối thiểu 8 ký tự.
        </p>
      </div>
      <div className="settings-password-grid">
        <Field label="Mật khẩu hiện tại">
          <input
            name="oldPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
        <Field label="Mật khẩu mới">
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        <Field label="Nhập lại mật khẩu mới">
          <input
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
      </div>
      <div>
        <button className="btn2" disabled={s.pending}>
          Cập nhật mật khẩu
        </button>
      </div>
    </form>
  );
}
