import { test } from "node:test";
import assert from "node:assert/strict";
import {
  usdToCents,
  validateRateInput,
} from "../src/features/rates/schemas/rate-input.ts";
import type { RateInput } from "../src/features/rates/types";

const valid: RateInput = {
  route: "aaaaaaaaaaaaaaa",
  carrier: "bbbbbbbbbbbbbbb",
  valid_from: "2026-11-01",
  valid_to: "2026-11-30",
  service_type: "direct",
  transit_days: 18,
  local_charges: "",
  surcharges: "",
  trade_term: "FOB",
  cargo_type: "GC",
  public_note: "",
  internal_note: "",
  schedule_ids: [],
  lines: [
    {
      container_type: "40HC",
      cost_price_cents: 110025,
      margin_mode: "row",
      margin_cents: 12575,
      expected_revision: 3,
    },
  ],
};

test("USD conversion preserves cents exactly and accepts a real zero price", () => {
  assert.equal(usdToCents("1100.25") + usdToCents("125.75"), 122600);
  assert.equal(usdToCents("0.01"), 1);
  assert.equal(usdToCents("0"), 0);
  assert.equal(usdToCents("10000000.00"), 1_000_000_000);
});

test("ambiguous, negative, fractional-cent and excessive prices are rejected", () => {
  for (const input of ["", "-1", "1,000", "1e3", "NaN", "1.001", "10000000.01"])
    assert.throws(() => usdToCents(input), input);
});

test("invalid calendar dates and incomplete or duplicate container lines cannot be saved", () => {
  assert.equal(validateRateInput(valid), valid);
  for (const input of [
    { ...valid, valid_from: "2026-02-30" },
    { ...valid, valid_to: "2026-10-31" },
    { ...valid, lines: [] },
    { ...valid, lines: [...valid.lines, ...valid.lines] },
    { ...valid, lines: [{ ...valid.lines[0], expected_revision: -1 }] },
  ])
    assert.throws(() => validateRateInput(input));
});

test("the combined sell price also obeys the API money limit", () => {
  assert.throws(() =>
    validateRateInput({
      ...valid,
      lines: [
        { ...valid.lines[0], cost_price_cents: 1_000_000_000, margin_cents: 1 },
      ],
    }),
  );
  assert.doesNotThrow(() =>
    validateRateInput({
      ...valid,
      lines: [{ ...valid.lines[0], cost_price_cents: 0, margin_cents: 0 }],
    }),
  );
});
