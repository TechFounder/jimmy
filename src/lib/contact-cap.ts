// Rolling 24-hour cap on contact-form emails, per site.
//
// The per-IP rate limiter raises the cost of abuse; it does not put a ceiling
// on it. This does. Counts live in the shared `contact-sends` D1 database,
// keyed by site domain.
//
// Everything here FAILS OPEN: a D1 blip must never close the contact form.
// The worst case of failing open is a bad day costing some email quota; the
// worst case of failing closed is a form nobody can use.
//
// Mirrors stalogue-site's contact modal (src/lib/send-budget.ts there).

/** Minimal slice of the D1 binding this module uses. */
export type D1Like = {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
  };
};

export const DEFAULT_CONTACT_DAILY_MAX = 10;

/** CONTACT_DAILY_MAX from the Worker env. Anything unset, empty, non-numeric
 * or non-positive falls back to the default -- never 0 or NaN, which would
 * silently close the form. */
export function contactDailyMax(env: Record<string, unknown>): number {
  const raw = env.CONTACT_DAILY_MAX;
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_CONTACT_DAILY_MAX;
}

/** Start of the rolling window, in the same strftime shape as the `sent_at`
 * column default. They must never drift apart: tests/contact-cap.spec.ts
 * checks both. */
export const WINDOW_START = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')";

export const COUNT_SQL = `SELECT COUNT(*) AS n FROM contact_sends WHERE site = ?1 AND sent_at >= ${WINDOW_START}`;

/** Contact emails this site sent in the last 24 hours. Returns 0 -- "under the
 * cap" -- if the binding is missing or the query fails (fail open). */
export async function countSiteLast24h(db: D1Like | undefined, site: string): Promise<number> {
  if (!db) return 0;
  try {
    const row = await db.prepare(COUNT_SQL).bind(site).first<{ n: number }>();
    return typeof row?.n === "number" ? row.n : 0;
  } catch (err) {
    console.error("Contact cap: count failed; treating the cap as available.", err);
    return 0;
  }
}

/** Log one accepted send. Never throws: failing to record must not turn an
 * email Resend already accepted into an error for the visitor. */
export async function recordContactSend(db: D1Like | undefined, site: string): Promise<void> {
  if (!db) return;
  try {
    await db.prepare("INSERT INTO contact_sends (site) VALUES (?1)").bind(site).run();
  } catch (err) {
    console.error("Contact cap: failed to record a send.", err);
  }
}
