import { test, expect } from "@playwright/test";
import { d1 } from "./helpers/d1";
import {
  COUNT_SQL,
  DEFAULT_CONTACT_DAILY_MAX,
  contactDailyMax,
} from "../src/lib/contact-cap";
const site = { domain: "jchen.me" }; // matches SITE in src/pages/api/contact.ts

// The daily cap is a GLOBAL count per site, so this file plants rows in the
// local D1 and must not run in parallel with itself. No other spec posts a
// payload that reaches the cap check, so the rest of the suite is unaffected.
test.describe.configure({ mode: "serial" });

const sql = (s: string) => `'${s.replace(/'/g, "''")}'`;
const countFor = (siteName: string) =>
  d1<{ n: number }>(COUNT_SQL.replace("?1", sql(siteName)))[0].n;

test.describe("contactDailyMax()", () => {
  test("parses a positive value", () => {
    expect(contactDailyMax({ CONTACT_DAILY_MAX: "25" })).toBe(25);
    expect(contactDailyMax({ CONTACT_DAILY_MAX: 3 })).toBe(3);
  });

  test("falls back on unset, empty, junk, zero or negative", () => {
    for (const v of [undefined, "", "abc", "0", "-5", 0, Number.NaN]) {
      expect(contactDailyMax({ CONTACT_DAILY_MAX: v })).toBe(DEFAULT_CONTACT_DAILY_MAX);
    }
  });
});

test.describe("rolling-window SQL", () => {
  const SITE = "window-test.invalid";
  test.afterAll(() => d1(`DELETE FROM contact_sends WHERE site = ${sql(SITE)}`));

  test("counts the last 24h only, and the column default matches the window shape", () => {
    d1(`DELETE FROM contact_sends WHERE site = ${sql(SITE)}`);
    // One row via the column DEFAULT (now), one 25h old in the same format.
    d1(`INSERT INTO contact_sends (site) VALUES (${sql(SITE)})`);
    d1(
      `INSERT INTO contact_sends (site, sent_at) VALUES (${sql(SITE)}, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-25 hours'))`,
    );

    const rows = d1<{ sent_at: string }>(
      `SELECT sent_at FROM contact_sends WHERE site = ${sql(SITE)} ORDER BY sent_at DESC`,
    );
    // If the DEFAULT and the window bound ever drift apart in format, the
    // string comparison silently stops matching. Pin the shape.
    expect(rows[0].sent_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(countFor(SITE)).toBe(1);
  });
});

test.describe("cap enforcement on /api/contact", () => {
  // Assumes CONTACT_DAILY_MAX is unset in the test env (default 10).
  const clear = () => d1(`DELETE FROM contact_sends WHERE site = ${sql(site.domain)}`);
  test.afterAll(clear);

  test("refuses a valid message with 503 once the site hits its cap", async ({ request }) => {
    clear();
    const values = Array.from({ length: DEFAULT_CONTACT_DAILY_MAX }, () => `(${sql(site.domain)})`).join(",");
    d1(`INSERT INTO contact_sends (site) VALUES ${values}`);

    const res = await request.post("/api/contact", {
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": "10.250.0.1" },
      data: {
        name: "Cap Test",
        email: "cap-test@example.com",
        subject: "Cap test",
        message: "This should be refused by the daily cap.",
      },
    });
    expect(res.status()).toBe(503);
    expect((await res.json()).error).toMatch(/limit/i);
  });

  test("honeypot is answered before the cap is consulted", async ({ request }) => {
    // Still over the cap from the previous test: a bot still gets a quiet 200.
    const res = await request.post("/api/contact", {
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": "10.250.0.2" },
      data: { nickname: "bot", name: "x", email: "x@example.com", subject: "x", message: "0123456789" },
    });
    expect(res.status()).toBe(200);
  });
});
