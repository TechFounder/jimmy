import type { APIRoute } from "astro";

// On-demand (server) route — runs as a Cloudflare function, not prerendered.
export const prerender = false;

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  nickname?: string; // honeypot
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export const POST: APIRoute = async ({ request, locals }) => {
  // Cloudflare exposes secrets on locals.runtime.env; fall back to
  // import.meta.env for local `astro dev`.
  const env = (locals as any)?.runtime?.env ?? import.meta.env;
  const RESEND_API_KEY = env.RESEND_API_KEY as string | undefined;
  const CONTACT_TO = (env.CONTACT_TO as string) || "123jcc@gmail.com";
  const CONTACT_FROM =
    (env.CONTACT_FROM as string) || "Contact Form <onboarding@resend.dev>";

  let body: ContactPayload;
  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();

  // Honeypot: silently accept so bots don't learn anything.
  if (body.nickname && body.nickname.trim() !== "") {
    return json({ ok: true });
  }

  // Validation (mirrors the client + the old Rails model).
  if (!name || !subject) {
    return json({ error: "Name and subject are required." }, 422);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: "Please enter a valid email address." }, 422);
  }
  if (message.length < 10 || message.length > 1000) {
    return json({ error: "Message must be between 10 and 1000 characters." }, 422);
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured.");
    return json({ error: "Email service is not configured." }, 500);
  }

  const html = `
    <h2>New contact from your site</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: CONTACT_FROM,
      to: [CONTACT_TO],
      reply_to: email,
      subject: `[jchen.me] ${subject}`,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Resend error:", res.status, detail);
    return json({ error: "Couldn't send your message. Please try again." }, 502);
  }

  return json({ ok: true });
};
