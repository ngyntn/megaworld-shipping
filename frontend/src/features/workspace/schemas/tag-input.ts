import { tagColors, type TagColor } from "../tags.ts";
export function parseTagInput(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  const color = String(form.get("color") ?? "");
  if (!name || name.length > 40) throw new Error("Nhập tên nhãn từ 1 đến 40 ký tự.");
  if (!Object.hasOwn(tagColors, color)) throw new Error("Chọn một trong 10 màu nhạt.");
  return { name, color: color as TagColor };
}
