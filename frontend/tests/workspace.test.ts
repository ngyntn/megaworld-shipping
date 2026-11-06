import { test } from "node:test";
import assert from "node:assert/strict";
import { parseEventInput, parseNoteInput } from "../src/features/workspace/schemas/workspace-input.ts";
import { monthCells, monthRange, noteEventTitle, savedLabel, shiftMonth, isMonthKey } from "../src/features/workspace/utils.ts";

const form = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};

test("event input trims text and accepts an all-day item", () => {
  assert.deepEqual(parseEventInput(form({ title: "  Gọi khách ", day: "2026-11-06", time: "", category: "customer" })), {
    title: "Gọi khách", day: "2026-11-06", time: "", category: "customer",
  });
});

test("event input rejects bad day, time and category", () => {
  const base = { title: "A", day: "2026-11-06", time: "09:00", category: "rate" };
  assert.throws(() => parseEventInput(form({ ...base, title: " " })), /Nhập nội dung/);
  assert.throws(() => parseEventInput(form({ ...base, day: "2026-02-30" })), /ngày hợp lệ/);
  assert.throws(() => parseEventInput(form({ ...base, time: "24:00" })), /HH:MM/);
  assert.throws(() => parseEventInput(form({ ...base, category: "x" })), /loại lịch/);
});

test("note input allows an empty title but not an empty note", () => {
  assert.deepEqual(parseNoteInput({ title: "", body: " Dòng 1 ", kind: "quote" }), { title: "", body: "Dòng 1", kind: "quote" });
  assert.throws(() => parseNoteInput({ title: " ", body: "", kind: "quote" }), /trống/);
  assert.throws(() => parseNoteInput({ title: "A", body: "x".repeat(2001), kind: "quote" }), /2000/);
  assert.throws(() => parseNoteInput({ title: "A", body: "", kind: "yellow" }), /loại ghi chú/);
  assert.throws(() => parseNoteInput(null), /trống/);
});

test("a dropped note becomes a one-line event title", () => {
  const body = "1. Hôm nay cần làm\n\n2. Báo giá cho khách  \r\n3. Nhập liệu";
  assert.equal(noteEventTitle({ title: "Nhắc việc", body }), "Nhắc việc: 1. Hôm nay cần làm, 2. Báo giá cho khách, 3. Nhập liệu");
  assert.equal(noteEventTitle({ title: "", body: "a\nb" }), "a, b");
  assert.equal(noteEventTitle({ title: "Chỉ tiêu đề", body: "" }), "Chỉ tiêu đề");
  const long = noteEventTitle({ title: "T", body: "x".repeat(300) });
  assert.equal(long.length, 200);
  assert.ok(long.endsWith("…"));
});

test("month helpers start weeks on Monday and wrap years", () => {
  const cells = monthCells("2026-11"); // 1 Nov 2026 is a Sunday
  assert.equal(cells.filter((c) => c === null).length, 6);
  assert.equal(cells.at(-1), "2026-11-30");
  assert.deepEqual(monthRange("2028-02"), { start: "2028-02-01", end: "2028-02-29" });
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(isMonthKey("2026-13"), false);
  assert.equal(isMonthKey("2026-11"), true);
});

test("saved label uses the Vietnam calendar day", () => {
  assert.equal(savedLabel("2026-11-05 18:30:00.000Z", "2026-11-06"), "Hôm nay"); // 01:30 on 6 Nov in Vietnam
  assert.equal(savedLabel("2026-11-05 03:00:00.000Z", "2026-11-06"), "Hôm qua");
  assert.equal(savedLabel("2026-11-03 03:00:00.000Z", "2026-11-06"), "03/11");
});
