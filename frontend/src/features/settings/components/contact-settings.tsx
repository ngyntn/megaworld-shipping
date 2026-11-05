"use client";
import { StyledSelect } from "@/components/ui/styled-select";
import { Field } from "@/features/operations/components/shared";
import { useSettingsForm } from "../hooks/use-settings-form";
import type { AccountData } from "@/features/operations/types";
export function ContactSettings({
  storefront: a,
}: {
  storefront: AccountData["storefront"];
}) {
  const s = useSettingsForm("contact");
  return (
    <form
      className="card settings-card"
      onChange={s.change}
      onSubmit={(e) => {
        e.preventDefault();
        s.save(e.currentTarget);
      }}
    >
      <h2>Liên hệ “Yêu cầu báo giá”</h2>
      <p className="muted" style={{ fontSize: 13 }}>
        Hiển thị cho khách ở nút Yêu cầu báo giá.
      </p>
      {!a.id && (
        <>
          <Field label="Tên trang khách">
            <input name="display_name" required maxLength={120} />
          </Field>
          <Field label="Đường dẫn trang khách">
            <input
              name="slug"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
              maxLength={80}
            />
          </Field>
          <small>Trang mới được tạo ở trạng thái chưa xuất bản.</small>
        </>
      )}
      <input type="hidden" name="contact_name" value={a.contact_name} />
      <Field label="Số Zalo">
        <input
          name="zalo_phone"
          type="tel"
          maxLength={40}
          defaultValue={a.zalo_phone}
        />
      </Field>
      <Field label="Số điện thoại">
        <input
          name="contact_phone"
          type="tel"
          maxLength={40}
          defaultValue={a.contact_phone}
        />
      </Field>
      <Field label="Email">
        <input
          name="contact_email"
          type="email"
          defaultValue={a.contact_email}
        />
      </Field>
      <Field label="Giờ làm việc">
        <input
          name="business_hours"
          maxLength={300}
          placeholder="VD: T2–T7, 8:00–17:30"
          defaultValue={a.business_hours}
        />
      </Field>
      <button className="btn" disabled={s.pending}>
        Lưu thông tin liên hệ
      </button>
    </form>
  );
}
export function PriceSettings({ account: a }: { account: AccountData }) {
  const s = useSettingsForm("preferences");
  return (
    <form
      className="card settings-card"
      onChange={s.change}
      onSubmit={(e) => {
        e.preventDefault();
        s.save(e.currentTarget);
      }}
    >
      <h2>Giá & hiển thị</h2>
      <Field label="Lợi nhuận mặc định (USD / container)">
        <input
          name="default_margin_usd"
          type="number"
          min={0}
          max={10000000}
          step="0.01"
          required
          defaultValue={a.settings.default_margin_cents / 100}
        />
      </Field>
      <Field label="Cảnh báo sắp hết hạn trước (ngày)">
        <StyledSelect
          name="expiry_warning_days"
          defaultValue={a.settings.expiry_warning_days}
        >
          {[...new Set([3, 7, 14, 30, a.settings.expiry_warning_days])]
            .sort((a, b) => a - b)
            .map((days) => (
              <option key={days} value={days}>
                {days} ngày
              </option>
            ))}
        </StyledSelect>
      </Field>
      <Field label="Ngôn ngữ mặc định cho khách">
        <StyledSelect
          name="default_language"
          defaultValue={a.storefront.default_language}
        >
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
          <option value="zh">中文</option>
        </StyledSelect>
      </Field>
      <button className="btn2" disabled={s.pending}>
        Lưu cài đặt
      </button>
    </form>
  );
}
