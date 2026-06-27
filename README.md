# jchen.me

Personal site for Jimmy Chen — a fast, animated, single-page portfolio.
The modern successor to the old Rails app (`jimmy2`).

**Stack:** [Astro](https://astro.build) · [Tailwind CSS v4](https://tailwindcss.com) · [GSAP](https://gsap.com) + [Lenis](https://lenis.darkroom.engineering) (scroll animation) · [Cloudflare Workers](https://workers.cloudflare.com) (hosting) · [Resend](https://resend.com) (contact email) · [Playwright](https://playwright.dev) (E2E tests) · GitHub Actions (CI).

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # then fill in your Resend key
npm run dev                      # http://localhost:4321
```

`npm run dev` runs Astro with the Cloudflare platform proxy, so the
`/api/contact` endpoint and its env vars work locally.

To exercise the production build the way Cloudflare serves it (builds, then
runs the Worker locally with `wrangler dev`):

```bash
npm run preview                  # = npm run build && wrangler dev
```

## Testing

End-to-end tests run in a headless browser via [Playwright](https://playwright.dev).
They lock in responsive layout and nav behavior so viewports don't have to
be checked by hand.

```bash
npx playwright install chromium  # one-time: download the browser
npm test                         # run the suite (tests/*.spec.ts)
npm test -- --ui                 # interactive watch/debug mode
```

The runner boots its own dev server (reusing one on `:4321` if already
running), so no separate `npm run dev` is needed.

**What's covered** (`tests/`):

- `responsive.spec.ts` — no horizontal overflow from 320–1280px, the 640px
  nav breakpoint (hamburger ↔ inline links), and the logo never wrapping.
- `nav.spec.ts` — the mobile dropdown's open/close, `aria-expanded`, and
  close-on-link / Escape / outside-click / resize-up behavior.
- `anchor-scroll.spec.ts` — clicking a nav link lands the target section
  just below the nav pill (desktop and via the mobile menu).
- `contact-api.spec.ts` — `/api/contact` validation (400/422), honeypot
  silent-accept (200), and the per-IP rate limit (429). Hits the API directly
  (no browser) and only exercises paths that short-circuit before Resend, so
  no real email is sent.

Assertions key off geometry and structural hooks (`data-*` attributes,
section ids) rather than copy, so they survive content edits.

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every pull
request and push to `main`, in two parallel jobs on Node 22:

- **Build** — `npm ci && npm run build`, so a broken `astro build` can't
  reach the deployed site.
- **E2E tests** — installs Chromium and runs `npm test`; on failure the
  Playwright report is uploaded as a build artifact.

Both surface as required-able status checks (see *Branch protection* below).

## Project structure

```
src/
  assets/projects/ project screenshots (optimized at build via astro:assets)
  components/    Nav, Hero, About, Experience, Work, WaysToWork,
                 Contact, ContactModal, Footer
  data/          projects.ts, experience.ts  ← edit your entries here
  layouts/       Layout.astro (head, global styles, scroll-reveal observer)
  pages/
    index.astro      composes the page + GSAP/Lenis scroll wiring
    api/contact.ts   serverless contact endpoint → Resend
  styles/global.css  design tokens + reveal primitives
tests/           Playwright E2E specs
public/images/   headshot (also the og:image)
public/_headers  security + cache-control response headers
.github/workflows/ci.yml   build + test on every PR/push to main
```

## Contact form

The form (`src/components/Contact.astro`) POSTs JSON to `/api/contact`
(`src/pages/api/contact.ts`), which validates, applies a honeypot, rate-limits
by IP, and emails the submission through Resend. Configure via these variables:

| Variable         | Purpose                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| `RESEND_API_KEY` | Resend API key — **required**                                                    |
| `CONTACT_TO`     | Inbox that receives submissions — **required** (no fallback; the API errors if unset) |
| `CONTACT_FROM`   | "From" address — optional (defaults to `onboarding@resend.dev`)                  |

## Security & headers

- **Rate limiting:** `/api/contact` is capped at 5 requests/minute per IP via
  the Cloudflare Workers Rate Limiting binding (`ratelimits` in
  [`wrangler.jsonc`](wrangler.jsonc)) — the 6th request in the window gets a
  429. Free on the Workers plan; a no-op under plain `astro dev` but live via
  the platform proxy and in production. A hidden honeypot field silently drops
  bot submissions.
- **Response headers:** [`public/_headers`](public/_headers) sets
  `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` on all
  responses, `immutable` caching for content-hashed `/_astro/*` assets, and a
  short cache for `/images/*`.
- **Cloudflare dashboard** (SSL/TLS → Edge Certificates): HSTS,
  `X-Content-Type-Options: nosniff`, and a minimum TLS version of 1.3 are set
  there rather than in `_headers`, since they apply globally (including the API
  response). HSTS starts with a short `max-age` — raise it once HTTPS is
  confirmed everywhere.

## Deploy to Cloudflare Workers

The site deploys as a Cloudflare **Worker** (static assets + the on-demand
`/api/contact` function), configured in [`wrangler.jsonc`](wrangler.jsonc).

### Manual deploy from your machine

```bash
npm run deploy                   # = npm run build && wrangler deploy
```

The first run prompts `wrangler` to authenticate with your Cloudflare
account. Secrets are stored on the Worker, not in the repo — set them once:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CONTACT_TO
npx wrangler secret put CONTACT_FROM
```

(Or add them under **Workers & Pages → `jimmy` → Settings → Variables and
Secrets** in the dashboard.) Regenerate the Cloudflare binding types after
config changes with `npm run cf-typegen`.

### Continuous deploy from GitHub

To redeploy on every push to `main`, connect the repo under **Workers &
Pages → Create → Import a repository** (build command `npm run build`), or
add a deploy step to CI using
[`cloudflare/wrangler-action`](https://github.com/cloudflare/wrangler-action)
with a `CLOUDFLARE_API_TOKEN` secret.

**Custom domain:** add `jchen.me` under the Worker's **Settings → Domains &
Routes** and follow the DNS steps.

### Resend setup

1. Create an account at [resend.com](https://resend.com) and an API key.
2. Add & verify your domain (`jchen.me`) under **Domains** — this lets you
   send from `hello@jchen.me` with good deliverability. Until then, the
   shared `onboarding@resend.dev` sender works for testing.
3. Free tier covers 3,000 emails/month (100/day) — ample for a contact form.

## Branch protection

`main` is the deploy branch, so it's worth gating. After the CI workflow
has run at least once (so its check names are registered), add a **ruleset**
in **GitHub → Settings → Rules → Rulesets** targeting `main`:

- **Require a pull request before merging** (0 required approvals is fine
  for a solo repo — you can't approve your own PR).
- **Require status checks to pass** → select **Build** and **E2E tests**.
- Leave *Restrict deletions* / *Block force pushes* on (the defaults).

Rulesets are GitHub's current, more flexible replacement for the older
"branch protection rules" — either works here, but rulesets are the
recommended path and let you keep an admin bypass if you ever need to
push a hotfix directly.
