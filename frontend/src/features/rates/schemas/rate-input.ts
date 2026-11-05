import { containers, type RateInput } from "../types.ts";
export function usdToCents(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim()))
    throw new Error("Nhập tiền USD không âm, tối đa 2 chữ số thập phân.");
  const [whole, fraction = ""] = value.trim().split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > 1_000_000_000)
    throw new Error("Số tiền vượt giới hạn 10.000.000 USD.");
  return cents;
}
export function validateRateInput(input: RateInput) {
  if (
    !input ||
    !/^[a-z0-9]{15}$/.test(input.route) ||
    !/^[a-z0-9]{15}$/.test(input.carrier)
  )
    throw new Error("Vui lòng chọn tuyến và hãng tàu hợp lệ.");
  const day = (s: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s;
  if (
    !day(input.valid_from) ||
    !day(input.valid_to) ||
    input.valid_to < input.valid_from
  )
    throw new Error("Khoảng ngày hiệu lực không hợp lệ.");
  if (
    !Number.isInteger(input.transit_days) ||
    input.transit_days < 0 ||
    input.transit_days > 365
  )
    throw new Error("Transit time phải từ 0 đến 365 ngày.");
  if (!["direct", "transit"].includes(input.service_type))
    throw new Error("Loại dịch vụ không hợp lệ.");
  if (
    !Array.isArray(input.lines) ||
    input.lines.length < 1 ||
    input.lines.length > 3
  )
    throw new Error("Nhập giá gốc cho ít nhất một container.");
  const seen = new Set<string>();
  for (const line of input.lines) {
    if (
      !containers.includes(line.container_type) ||
      seen.has(line.container_type)
    )
      throw new Error("Loại container không hợp lệ hoặc trùng.");
    seen.add(line.container_type);
    for (const amount of [
      line.cost_price_cents,
      ...(line.margin_mode === "row" ? [line.margin_cents] : []),
    ])
      if (
        !Number.isSafeInteger(amount) ||
        amount! < 0 ||
        amount! > 1_000_000_000
      )
        throw new Error("Giá gốc hoặc lợi nhuận không hợp lệ.");
    if (
      !Number.isInteger(line.expected_revision) ||
      line.expected_revision < 0 ||
      !["row", "route", "default"].includes(line.margin_mode)
    )
      throw new Error("Phiên bản hoặc cách tính lãi không hợp lệ.");
    if (
      line.margin_mode === "row" &&
      line.cost_price_cents + line.margin_cents! > 1_000_000_000
    )
      throw new Error("Giá bán vượt giới hạn.");
  }
  for (const [field, limit] of [
    ["local_charges", 2000],
    ["surcharges", 2000],
    ["trade_term", 20],
    ["cargo_type", 40],
    ["public_note", 4000],
    ["internal_note", 8000],
  ] as const)
    if (typeof input[field] !== "string" || input[field].length > limit)
      throw new Error("Nội dung ghi chú hoặc phụ phí vượt giới hạn.");
  if (
    !Array.isArray(input.schedule_ids) ||
    input.schedule_ids.length > 100 ||
    input.schedule_ids.some((s) => !/^[a-z0-9]{15}$/.test(s))
  )
    throw new Error("Lịch tàu không hợp lệ.");
  return input;
}
