import { test } from "node:test";
import assert from "node:assert/strict";
import { boardNoteText } from "../src/features/whiteboard/utils.ts";

test("saving a board preserves text, list markers and line breaks", () => {
  assert.equal(boardNoteText([
    { b: false, t: "Nhắc việc" },
    { b: false, t: "" },
    { b: true, t: "Gọi khách" },
    { b: true, t: "Gửi báo giá" },
  ]), "Nhắc việc\n\n- Gọi khách\n- Gửi báo giá");
});

test("image data never enters a plain-text note and whitespace-only boards stay empty", () => {
  assert.equal(boardNoteText([{ b: false, t: "", img: "data:image/png;base64,test" }, { b: false, t: "Nội dung" }]), "Nội dung");
  assert.equal(boardNoteText([{ b: false, t: "  " }]), "");
});
