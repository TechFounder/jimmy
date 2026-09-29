import { test, expect } from "@playwright/test";
import { turnstileEnabled, verifyTurnstile } from "../src/lib/turnstile";

// Turnstile is OFF by default (no site key at build time, no secret), so the
// rest of the suite runs exactly as before. This file covers:
//   1. the enable rule and the fail-open / fail-closed policy, with a stubbed
//      siteverify (no network);
//   2. that the default build ships no widget and no script;
//   3. OPT-IN, with Cloudflare's documented TEST keys (public, always pass).
//      CI runs this as its own step (.github/workflows/ci.yml). Locally:
//        - add TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA to
//          .dev.vars (read by the platform proxy at dev time), then
//        - PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA TURNSTILE_E2E=1 \
//            npx playwright test tests/turnstile.spec.ts
//      The site key must be in the shell env: Astro inlines PUBLIC_* when the
//      dev server starts, so stop any running dev server first. The real-widget
//      test needs network access to challenges.cloudflare.com.

const stub = (status: number, body: unknown) =>
  (async () =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), { status })) as typeof fetch;

test.describe("turnstileEnabled()", () => {
  test("needs BOTH the site key and the secret", () => {
    expect(turnstileEnabled("key", "secret")).toBe(true);
    expect(turnstileEnabled("key", undefined)).toBe(false);
    expect(turnstileEnabled(undefined, "secret")).toBe(false); // the dangerous direction: off, logged
    expect(turnstileEnabled("", "")).toBe(false);
    expect(turnstileEnabled("  ", "secret")).toBe(false);
  });
});

test.describe("verifyTurnstile()", () => {
  test("fails closed on a missing, empty or oversized token without calling siteverify", async () => {
    let called = false;
    const spy = (async () => ((called = true), new Response("{}"))) as typeof fetch;
    for (const t of [undefined, "", "   ", 42, "x".repeat(2049)]) {
      expect(await verifyTurnstile("s", t, undefined, spy)).toBe("missing-token");
    }
    expect(called).toBe(false);
  });

  test("ok on success, failed on a token rejection", async () => {
    expect(await verifyTurnstile("s", "tok", undefined, stub(200, { success: true }))).toBe("ok");
    expect(
      await verifyTurnstile("s", "tok", undefined, stub(200, { success: false, "error-codes": ["invalid-input-response"] })),
    ).toBe("failed");
    expect(
      await verifyTurnstile("s", "tok", undefined, stub(200, { success: false, "error-codes": ["timeout-or-duplicate"] })),
    ).toBe("failed");
    expect(await verifyTurnstile("s", "tok", undefined, stub(200, { success: false }))).toBe("failed");
  });

  test("fails open on siteverify trouble", async () => {
    expect(await verifyTurnstile("s", "tok", undefined, stub(500, "oops"))).toBe("ok");
    expect(await verifyTurnstile("s", "tok", undefined, stub(200, "not json"))).toBe("ok");
    expect(await verifyTurnstile("s", "tok", undefined, stub(200, { weird: 1 }))).toBe("ok");
    expect(
      await verifyTurnstile("s", "tok", undefined, stub(200, { success: false, "error-codes": ["invalid-input-secret"] })),
    ).toBe("ok");
    const boom = (async () => {
      throw new Error("network down");
    }) as typeof fetch;
    expect(await verifyTurnstile("s", "tok", undefined, boom)).toBe("ok");
  });
});

test.describe("default build (no site key)", () => {
  test.skip(!!process.env.TURNSTILE_E2E, "dev server was started WITH a site key");

  test("ships no widget container and no Turnstile script", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#turnstile-api")).toHaveCount(0);
    await expect(page.locator("[data-turnstile]")).toHaveCount(0);
    await expect(page.locator("#contact-form")).not.toHaveAttribute("data-turnstile-sitekey", /.+/);
  });
});

test.describe("opt-in: dev server started with the test keys", () => {
  test.skip(!process.env.TURNSTILE_E2E, "set TURNSTILE_E2E=1 (see header)");

  test("API refuses a valid message with no token (403)", async ({ request }) => {
    const res = await request.post("/api/contact", {
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": "10.251.0.1" },
      data: { name: "T", email: "t@example.com", subject: "T", message: "No token at all here." },
    });
    expect(res.status()).toBe(403);
  });

  test("API accepts a genuine test-key token (CI only: locally this would send a real email)", async ({ request }) => {
    test.skip(!process.env.CI, "runs in CI, where no Resend key exists");
    const res = await request.post("/api/contact", {
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": "10.251.0.2" },
      data: {
        name: "T",
        email: "t@example.com",
        subject: "T",
        message: "Dummy token from the test keys.",
        "cf-turnstile-response": "XXXX.DUMMY.TOKEN.XXXX",
      },
    });
    // Past Turnstile; CI has no Resend key, so it stops at the config check.
    expect(res.status()).toBe(500);
  });

  test("render is explicit, on first open only, and reset after each submit (stubbed API, no network)", async ({ page }) => {
    // Serve an empty api.js and install a recording stub in its place, so the
    // page's own wiring is exercised without reaching Cloudflare.
    await page.route("https://challenges.cloudflare.com/**", (r) =>
      r.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
    );
    await page.addInitScript(() => {
      const calls: string[] = [];
      (window as any).__tsCalls = calls;
      (window as any).turnstile = {
        render(el: HTMLElement) {
          calls.push("render");
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = "cf-turnstile-response";
          input.value = "stub-token";
          el.appendChild(input);
          return "w1";
        },
        reset(id: string) {
          calls.push(`reset:${id}`);
        },
      };
    });
    await page.route("**/api/contact", (r) =>
      r.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "nope" }) }),
    );

    await page.goto("/");
    const calls = () => page.evaluate(() => (window as any).__tsCalls as string[]);
    expect(await calls()).toEqual([]); // nothing rendered while closed

    await page.locator("[data-open-modal]").first().click();
    await expect.poll(calls).toEqual(["render"]);
    await page.keyboard.press("Escape");
    await page.locator("[data-open-modal]").first().click();
    expect(await calls()).toEqual(["render"]); // not re-rendered on reopen

    await page.fill('input[name="name"]', "T");
    await page.fill('input[name="email"]', "t@example.com");
    await page.fill('textarea[name="message"]', "A message long enough.");
    await page.click('#contact-form button[type="submit"]');
    await expect.poll(calls).toEqual(["render", "reset:w1"]);
  });

  test("widget renders only when the modal opens, and yields a token (needs challenges.cloudflare.com)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#contact-form")).toHaveAttribute("data-turnstile-sitekey", /.+/);
    // The widget's iframe lives in a CLOSED shadow root, so no locator can
    // see it (checked on stalogue.com, 2026-09-27). The light-DOM trace of a
    // render is the hidden `cf-turnstile-response` input the widget adds, and
    // with the test site key it fills with the dummy token.
    const response = page.locator('[data-turnstile] input[name="cf-turnstile-response"]');
    await expect(response).toHaveCount(0); // nothing rendered while closed
    await page.locator("[data-open-modal]").first().click();
    await expect(response).toHaveCount(1, { timeout: 15_000 });
    await expect(response).toHaveValue("XXXX.DUMMY.TOKEN.XXXX", { timeout: 15_000 });
  });
});
