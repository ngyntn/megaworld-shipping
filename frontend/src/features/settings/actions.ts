"use server";
import { cookies } from "next/headers";
import type PocketBase from "pocketbase";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth/services/session";
import { operationError } from "@/features/operations/services/errors";
import { sessionCookie } from "@/lib/pocketbase/server";
/** Sign in again with the new credentials and replace the session cookie. */
async function refreshSession(pb: PocketBase, email: string, password: string) {
  const auth = await pb.collection("staff").authWithPassword(email, password);
  (await cookies()).set(sessionCookie, auth.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
export async function updateAccount(
  kind: "profile" | "password" | "contact" | "preferences",
  form: FormData,
) {
  const { pb, staff } = await requireSession();
  const value = (k: string) => String(form.get(k) || "").trim();
  try {
    if (kind === "profile") {
      if (!value("name")) throw Error("Nhập họ và tên.");
      const email = value("email").toLowerCase();
      const changingEmail = email !== String(staff.email).toLowerCase();
      const password = String(form.get("oldPassword") || "");
      if (changingEmail && !password)
        throw Error("Nhập mật khẩu hiện tại để đổi email.");
      await pb.collection("staff").update(staff.id, {
        name: value("name"),
        job_title: value("job_title"),
        phone: value("phone"),
      });
      if (changingEmail) {
        // PocketBase only lets superusers change `email`; the backend route re-checks the
        // password and performs the change (backend/pb_hooks/70_account.pb.js).
        await pb.send("/api/megaworld/admin/account/email", {
          method: "POST",
          body: { email, password },
        });
        await refreshSession(pb, email, password);
      }
    } else if (kind === "password") {
      const oldPassword = String(form.get("oldPassword") || ""),
        password = String(form.get("password") || ""),
        passwordConfirm = String(form.get("passwordConfirm") || "");
      if (!oldPassword || password.length < 8 || password !== passwordConfirm)
        throw Error(
          "Nhập mật khẩu hiện tại và mật khẩu mới tối thiểu 8 ký tự, nhập lại khớp nhau.",
        );
      await pb
        .collection("staff")
        .update(staff.id, { oldPassword, password, passwordConfirm });
      await refreshSession(pb, staff.email, password);
    } else if (kind === "contact") {
      const stores = await pb.collection("storefronts").getList(1, 1);
      const store = stores.items[0];
      const data = {
        contact_name: value("contact_name"),
        contact_email: value("contact_email"),
        contact_phone: value("contact_phone"),
        zalo_phone: value("zalo_phone"),
        business_hours: value("business_hours"),
      };
      if (store) await pb.collection("storefronts").update(store.id, data);
      else {
        if (!value("slug") || !value("display_name"))
          throw Error("Nhập tên trang và đường dẫn trang khách.");
        await pb
          .collection("storefronts")
          .create({
            ...data,
            owner: staff.id,
            slug: value("slug"),
            display_name: value("display_name"),
            default_language: "vi",
            published: false,
          });
      }
    } else if (kind === "preferences") {
      const amount = value("default_margin_usd"),
        days = Number(value("expiry_warning_days")),
        language = value("default_language");
      if (
        !/^\d+(\.\d{1,2})?$/.test(amount) ||
        Number(amount) > 10000000 ||
        !Number.isInteger(days) ||
        days < 0 ||
        days > 365 ||
        !["vi", "en", "zh"].includes(language)
      )
        throw Error(
          "Lợi nhuận phải là USD không âm, tối đa 2 số thập phân; cảnh báo từ 0 đến 365 ngày.",
        );
      const [settings, stores] = await Promise.all([
        pb.collection("staff_settings").getList(1, 1),
        pb.collection("storefronts").getList(1, 1),
      ]);
      if (!stores.items[0])
        throw Error(
          "Lưu thông tin liên hệ và tạo trang khách trước khi cài đặt ngôn ngữ.",
        );
      const data = {
        default_margin_cents: Math.round(Number(amount) * 100),
        expiry_warning_days: days,
      };
      await pb
        .collection("storefronts")
        .update(stores.items[0].id, { default_language: language });
      if (settings.items[0])
        await pb
          .collection("staff_settings")
          .update(settings.items[0].id, data);
      else
        await pb
          .collection("staff_settings")
          .create({ ...data, owner: staff.id });
    } else throw Error("Thao tác không hợp lệ.");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/rates");
    return {
      success:
        kind === "password" ? "Đã cập nhật mật khẩu." : "Đã lưu thay đổi.",
    };
  } catch (e) {
    return operationError(e);
  }
}
