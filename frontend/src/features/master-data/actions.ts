"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth/services/session";
import { operationError } from "@/features/operations/services/errors";
export async function ensureRoute(
  pol: string,
  pod: string,
): Promise<{ id?: string; error?: string }> {
  const { pb, staff } = await requireSession();
  try {
    if (
      !/^[a-z0-9]{15}$/.test(pol) ||
      !/^[a-z0-9]{15}$/.test(pod) ||
      pol === pod
    )
      throw Error("Chọn POL và POD hợp lệ.");
    const found = await pb
      .collection("routes")
      .getList(1, 1, {
        filter: pb.filter("pol={:pol} && pod={:pod}", { pol, pod }),
      });
    if (found.items[0]) {
      if (!found.items[0].active) throw Error("Tuyến đã ngừng hoạt động.");
      return { id: found.items[0].id };
    }
    const route = await pb
      .collection("routes")
      .create({ pol, pod, owner: staff.id, active: true });
    return { id: route.id };
  } catch (e) {
    return operationError(e);
  }
}
export async function saveCatalog(
  kind: "carriers" | "ports",
  id: string,
  form: FormData,
) {
  const { pb, staff } = await requireSession();
  try {
    if (
      !["carriers", "ports"].includes(kind) ||
      (id && !/^[a-z0-9]{15}$/.test(id))
    )
      throw Error("Danh mục không hợp lệ.");
    const data = new FormData();
    const fields =
      kind === "carriers"
        ? ["code", "name", "active"]
        : [
            "code",
            "name",
            "active",
            "unlocode",
            "country_code",
            "region",
            "can_be_pol",
            "can_be_pod",
          ];
    for (const key of fields) data.set(key, String(form.get(key) ?? ""));
    if (
      !String(form.get("code") || "").trim() ||
      !String(form.get("name") || "").trim()
    )
      throw Error("Nhập mã và tên danh mục.");
    if (
      kind === "ports" &&
      form.get("can_be_pol") === "true" &&
      form.get("country_code") !== "VN"
    )
      throw Error("POL phải thuộc Việt Nam.");
    const logo = form.get("logo");
    if (logo instanceof File && logo.size) {
      if (
        logo.size > 200 * 1024 ||
        !["image/png", "image/jpeg", "image/webp"].includes(logo.type)
      )
        throw Error("Logo phải là PNG, JPEG hoặc WebP, tối đa 200 KB.");
      data.set("logo", logo);
    }
    if (id) await pb.collection(kind).update(id, data);
    else {
      data.set("owner", staff.id);
      await pb.collection(kind).create(data);
    }
    // Carrier logos/names appear on every admin page (rates, dashboard, schedules).
    revalidatePath("/admin", "layout");
    return { success: "Đã lưu danh mục." };
  } catch (e) {
    return operationError(e);
  }
}
export async function toggleCatalog(
  kind: "carriers" | "ports",
  id: string,
  active: boolean,
) {
  const { pb } = await requireSession();
  try {
    if (
      !["carriers", "ports"].includes(kind) ||
      !/^[a-z0-9]{15}$/.test(id) ||
      typeof active !== "boolean"
    )
      throw Error("Danh mục không hợp lệ.");
    await pb.collection(kind).update(id, { active });
    revalidatePath("/admin", "layout");
    return { success: "Đã cập nhật hiển thị." };
  } catch (e) {
    return operationError(e);
  }
}
