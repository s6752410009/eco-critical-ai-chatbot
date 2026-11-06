import {
  ApiError,
  requireTeacher,
  requireAdmin,
  sameOrigin,
  bodyJson,
  reply,
  audit,
} from "./school-auth.mjs";
const PRICE_SOURCE = "https://developers.openai.com/api/docs/models/gpt-6-luna";
export function estimateUsage(result) {
  const u = result?.usage,
    integer = (n) => Number.isSafeInteger(n) && n >= 0;
  if (!u || !integer(u.input_tokens) || !integer(u.output_tokens)) return null;
  const cached = u.input_tokens_details?.cached_tokens ?? 0,
    writes = u.input_tokens_details?.cache_write_tokens ?? 0;
  if (!integer(cached) || !integer(writes) || cached + writes > u.input_tokens)
    return null;
  const tokens = {
    input: u.input_tokens,
    output: u.output_tokens,
    cached,
    writes,
  };
  // Snapshot rates per request; unknown models/tiers remain explicitly unpriced.
  if (
    !/^gpt-6-luna(?:-\d{4}-\d{2}-\d{2})?$/.test(result.model || "") ||
    (result.service_tier && result.service_tier !== "default")
  )
    return { ...tokens, cost: null, pricing: null };
  const long = u.input_tokens > 272000,
    rates = {
      input: long ? 0.2 : 0.1,
      cached: long ? 0.02 : 0.01,
      write: long ? 0.25 : 0.125,
      output: long ? 0.75 : 0.5,
    };
  return {
    ...tokens,
    cost: Math.round(
      ((tokens.input - cached - writes) * rates.input +
        cached * rates.cached +
        writes * rates.write +
        tokens.output * rates.output) *
        1000
    ),
    pricing: JSON.stringify({
      rates,
      unit: "USD per million tokens",
      verified: "2026-11-06",
      source: PRICE_SOURCE,
    }),
  };
}
export async function beginUsage(config, purpose) {
  if (!config.accounting) return null;
  const id = crypto.randomUUID();
  await config.accounting.BOARD_DB.prepare(
    "INSERT INTO school_ai_usage(id,created_at,purpose,model) VALUES(?,?,?,?)"
  )
    .bind(id, Date.now(), purpose, config.model)
    .run();
  return id;
}
export async function finishUsage(config, id, result, status) {
  if (!id) return;
  const usage = estimateUsage(result);
  await config.accounting.BOARD_DB.prepare(
    "UPDATE school_ai_usage SET status=?,model=?,input_tokens=?,cached_tokens=?,cache_write_tokens=?,output_tokens=?,cost_nano=?,pricing=?,response_id=? WHERE id=?"
  )
    .bind(
      status,
      result?.model || config.model,
      usage?.input ?? null,
      usage?.cached ?? null,
      usage?.writes ?? null,
      usage?.output ?? null,
      usage?.cost ?? null,
      usage?.pricing ?? null,
      result?.id || null,
      id
    )
    .run();
}
export function monthRange(month, now = Date.now()) {
  const current = new Date(now + 7 * 3600000).toISOString().slice(0, 7);
  const selected = month || current;
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(selected))
    throw new ApiError("เดือนต้องอยู่ในรูปแบบ YYYY-MM");
  const [y, m] = selected.split("-").map(Number);
  return {
    month: selected,
    current,
    start: Date.UTC(y, m - 1, 1) - 7 * 3600000,
    end: Date.UTC(y, m, 1) - 7 * 3600000,
  };
}
export async function usageReport(env, month) {
  const range = monthRange(month);
  const row = await env.BOARD_DB.prepare(
    "SELECT value FROM school_settings WHERE key='ai_budget'"
  ).first();
  const settings = row
    ? JSON.parse(row.value)
    : { monthlyUsd: 10, warningPercent: 80 };
  const fields =
    "COUNT(*) AS requests,COALESCE(SUM(input_tokens),0) AS inputTokens,COALESCE(SUM(cached_tokens),0) AS cachedTokens,COALESCE(SUM(output_tokens),0) AS outputTokens,COALESCE(SUM(cost_nano),0) AS costNano,COALESCE(SUM(CASE WHEN cost_nano IS NULL THEN 1 ELSE 0 END),0) AS unpriced";
  const where = " FROM school_ai_usage WHERE created_at>=? AND created_at<?";
  const totals = await env.BOARD_DB.prepare("SELECT " + fields + where)
    .bind(range.start, range.end)
    .first();
  const { results: daily } = await env.BOARD_DB.prepare(
    "SELECT strftime('%Y-%m-%d',created_at/1000,'unixepoch','+7 hours') AS day," +
      fields +
      where +
      " GROUP BY day ORDER BY day"
  )
    .bind(range.start, range.end)
    .all();
  const { results: breakdown } = await env.BOARD_DB.prepare(
    "SELECT purpose,model," +
      fields +
      where +
      " GROUP BY purpose,model ORDER BY costNano DESC"
  )
    .bind(range.start, range.end)
    .all();
  const first = await env.BOARD_DB.prepare(
    "SELECT MIN(created_at) AS startedAt FROM school_ai_usage"
  ).first();
  const percent =
    settings.monthlyUsd > 0
      ? (totals.costNano / 1e9 / settings.monthlyUsd) * 100
      : null;
  return {
    ...range,
    settings,
    totals,
    daily,
    breakdown,
    startedAt: first.startedAt,
    percent,
    alert:
      percent === null
        ? "disabled"
        : percent >= 100
          ? "exceeded"
          : percent >= settings.warningPercent
            ? "warning"
            : "normal",
    currency: "USD",
    priceSource: PRICE_SOURCE,
  };
}
export async function usageRoute(request, env, user) {
  requireTeacher(user);
  if (request.method === "GET")
    return reply(
      await usageReport(env, new URL(request.url).searchParams.get("month"))
    );
  if (request.method === "POST") {
    requireAdmin(user);
    sameOrigin(request);
    const value = await bodyJson(request),
      { monthlyUsd, warningPercent } = value;
    if (
      typeof monthlyUsd !== "number" ||
      !Number.isFinite(monthlyUsd) ||
      monthlyUsd < 0 ||
      monthlyUsd > 100000 ||
      Math.abs(monthlyUsd * 100 - Math.round(monthlyUsd * 100)) > 1e-6 ||
      !Number.isInteger(warningPercent) ||
      warningPercent < 1 ||
      warningPercent > 99
    )
      throw new ApiError(
        "กรอกงบ 0–100,000 USD (ทศนิยมไม่เกิน 2 ตำแหน่ง) และเกณฑ์เตือน 1–99%"
      );
    await env.BOARD_DB.prepare(
      "INSERT INTO school_settings(key,value,updated_at) VALUES('ai_budget',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at"
    )
      .bind(JSON.stringify({ monthlyUsd, warningPercent }), Date.now())
      .run();
    await audit(env, user, "ai_budget_saved");
    return reply({ success: true });
  }
  throw new ApiError("ไม่รองรับการทำรายการนี้", 405);
}
