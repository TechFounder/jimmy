import { test, expect, type APIRequestContext } from "@playwright/test";

// Contact API validation, honeypot, and rate limiting. The validation/honeypot
// paths short-circuit BEFORE the Resend call, so these tests never send real
// email. The @astrojs/cloudflare platform proxy makes the rate-limit binding
// live even under `astro dev`, and it keys on the CF-Connecting-IP header — so
// every test uses a unique IP to stay isolated, except the rate-limit test
// which deliberately reuses one. Assertions key on status codes and the stable
// error copy from src/pages/api/contact.ts.

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "Hello",
  message: "This is a sufficiently long message.",
};

// Random RFC1918 IP so each test gets its own rate-limit bucket.
const freshIp = () =>
  `10.${rnd()}.${rnd()}.${rnd()}`;
const rnd = () => Math.floor(Math.random() * 256);

const post = (
  request: APIRequestContext,
  data: unknown,
  ip = freshIp(),
  raw = false,
) =>
  request.post("/api/contact", {
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
    // Buffer is sent verbatim; a plain string would be re-serialized as JSON
    // (and so wouldn't be malformed anymore).
    ...(raw ? { data: Buffer.from(data as string) } : { data }),
  });

test.describe("POST /api/contact", () => {
  test("rejects malformed JSON with 400", async ({ request }) => {
    const res = await post(request, "{not valid json", undefined, true);
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe("Invalid request.");
  });

  test("requires name and subject", async ({ request }) => {
    const res = await post(request, {});
    expect(res.status()).toBe(422);
    expect((await res.json()).error).toBe("Name and subject are required.");
  });

  test("rejects an invalid email address", async ({ request }) => {
    const res = await post(request, { ...valid, email: "not-an-email" });
    expect(res.status()).toBe(422);
    expect((await res.json()).error).toBe("Please enter a valid email address.");
  });

  test("rejects a too-short message", async ({ request }) => {
    const res = await post(request, { ...valid, message: "short" });
    expect(res.status()).toBe(422);
    expect((await res.json()).error).toBe(
      "Message must be between 10 and 1000 characters.",
    );
  });

  test("rejects a too-long message", async ({ request }) => {
    const res = await post(request, { ...valid, message: "a".repeat(1001) });
    expect(res.status()).toBe(422);
    expect((await res.json()).error).toBe(
      "Message must be between 10 and 1000 characters.",
    );
  });

  test("silently accepts honeypot submissions without sending", async ({
    request,
  }) => {
    // A filled `nickname` (hidden field) marks a bot — the API returns ok so the
    // bot learns nothing, and short-circuits before any email is sent.
    const res = await post(request, { ...valid, nickname: "i-am-a-bot" });
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  test("rate-limits a flood from one IP (6th request in 60s → 429)", async ({
    request,
  }) => {
    const ip = freshIp();
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      // Empty body: the limiter runs before validation, so the first five are
      // let through (and fail validation with 422), then the sixth is throttled.
      const res = await post(request, {}, ip);
      statuses.push(res.status());
    }
    expect(statuses.slice(0, 5)).not.toContain(429);
    expect(statuses[5]).toBe(429);
  });
});
