import test from "node:test";
import assert from "node:assert/strict";
import { estimateUsage, monthRange } from "../../cloudflare/school-usage.mjs";
const response = (input, output, cached = 0, writes = 0) => ({
  model: "gpt-6-luna",
  service_tier: "default",
  usage: {
    input_tokens: input,
    output_tokens: output,
    input_tokens_details: { cached_tokens: cached, cache_write_tokens: writes },
  },
});
test("prices actual input, cache reads, cache writes and output without double counting", () => {
  const value = estimateUsage(response(1000, 200, 200, 100));
  assert.equal(value.cost, 184500);
  assert.equal(value.cached, 200);
});
test("long context rates apply only above 272K input tokens", () => {
  assert.equal(estimateUsage(response(272000, 100)).cost, 27250000);
  assert.equal(estimateUsage(response(272001, 100)).cost, 54475200);
});
test("unknown models and nonstandard tiers never show invented zero prices", () => {
  assert.equal(
    estimateUsage({ ...response(100, 20), model: "unknown" }).cost,
    null
  );
  assert.equal(
    estimateUsage({ ...response(100, 20), service_tier: "priority" }).cost,
    null
  );
  assert.equal(estimateUsage({}), null);
  assert.equal(estimateUsage(response(100, 20, 101)), null);
  assert.equal(estimateUsage(response(-1, 20)), null);
});
test("Bangkok month boundaries handle UTC rollover and leap years", () => {
  const range = monthRange(null, Date.parse("2026-10-31T18:00:00Z"));
  assert.equal(range.month, "2026-11");
  assert.equal(new Date(range.start).toISOString(), "2026-10-31T17:00:00.000Z");
  const leap = monthRange("2028-02");
  assert.equal(leap.end - leap.start, 29 * 86400000);
  assert.throws(() => monthRange("2026-13"));
});
