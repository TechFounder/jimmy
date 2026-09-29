// Cloudflare Turnstile server-side verification for the contact form.
// Mirrors stalogue-site's src/lib/turnstile.ts.
//
// Policy:
// - Enforced only when BOTH the build-time site key and the runtime secret are
//   set. Secret-without-site-key means no widget renders, so no browser could
//   ever produce a token and every real message would be rejected. Requiring
//   both turns that mistake into "protection off", logged as an error.
// - FAIL CLOSED on a missing token or one Cloudflare rejects: accepting an
//   empty token would make the widget decorative.
// - FAIL OPEN on siteverify trouble (network error, timeout, non-200,
//   unparseable body, or an error code that describes OUR configuration or
//   Cloudflare's, not the visitor's token). An outage must not close the form;
//   the rate limiter and the daily cap still stand.

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5_000;
/** Documented maximum token length. */
const MAX_TOKEN_LEN = 2048;

/** Error codes that are not a verdict on the visitor's token. */
const INFRA_CODES = new Set(["missing-input-secret", "invalid-input-secret", "internal-error"]);

export type TurnstileOutcome = "ok" | "missing-token" | "failed";

/** True only when both halves of the configuration are present. */
export function turnstileEnabled(siteKey: unknown, secret: unknown): boolean {
  const hasKey = typeof siteKey === "string" && siteKey.trim() !== "";
  const hasSecret = typeof secret === "string" && secret.trim() !== "";
  if (hasSecret && !hasKey) {
    console.error(
      "Turnstile secret is set but PUBLIC_TURNSTILE_SITE_KEY is not: no widget can render, so the check is OFF.",
    );
  }
  return hasKey && hasSecret;
}

export async function verifyTurnstile(
  secret: string,
  token: unknown,
  remoteIp?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<TurnstileOutcome> {
  if (typeof token !== "string" || !token.trim() || token.length > MAX_TOKEN_LEN) return "missing-token";

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (remoteIp && remoteIp !== "unknown") body.append("remoteip", remoteIp);

  try {
    const res = await fetchImpl(SITEVERIFY, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("Turnstile siteverify returned", res.status, "- letting the message through.");
      return "ok";
    }
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data?.success === true) return "ok";
    if (data?.success === false) {
      const codes = data["error-codes"] ?? [];
      if (codes.length > 0 && codes.every((c) => INFRA_CODES.has(c))) {
        console.error("Turnstile siteverify configuration/infra error:", codes.join(","), "- letting the message through.");
        return "ok";
      }
      console.warn("Turnstile rejected a token:", codes.join(",") || "no codes");
      return "failed";
    }
    console.error("Turnstile siteverify returned an unrecognised body - letting the message through.");
    return "ok";
  } catch (err) {
    console.error("Turnstile siteverify unreachable - letting the message through.", err);
    return "ok";
  }
}
