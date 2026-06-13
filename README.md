# jchen.me

Personal site for Jimmy Chen — a fast, animated, single-page portfolio.
The modern successor to the old Rails app (`jimmy2`).

**Stack:** [Astro](https://astro.build) · [Tailwind CSS v4](https://tailwindcss.com) · [GSAP](https://gsap.com) (scroll animation) · [Cloudflare Pages](https://pages.cloudflare.com) (hosting) · [Resend](https://resend.com) (contact email).

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # then fill in your Resend key
npm run dev                      # http://localhost:4321
```

`npm run dev` runs Astro with the Cloudflare platform proxy, so the
`/api/contact` endpoint and its env vars work locally.

To exercise the production build the way Cloudflare serves it:

```bash
npm run build
npm run preview                  # wrangler pages dev ./dist
```

## Project structure

```
src/
  components/    Nav, Hero, About, Work, Contact, Footer
  data/          projects.ts  ← edit your portfolio entries here
  layouts/       Layout.astro (head, global styles, scroll-reveal observer)
  pages/
    index.astro      composes the page + GSAP hero animation
    api/contact.ts   serverless contact endpoint → Resend
  styles/global.css  design tokens + reveal primitives
public/images/   headshot + project screenshots
```

## Contact form

The form (`src/components/Contact.astro`) POSTs JSON to `/api/contact`
(`src/pages/api/contact.ts`), which validates, applies a honeypot, and
emails the submission through Resend. Configure via these variables:

| Variable         | Purpose                                   |
| ---------------- | ----------------------------------------- |
| `RESEND_API_KEY` | Resend API key (required)                 |
| `CONTACT_TO`     | Inbox that receives submissions           |
| `CONTACT_FROM`   | Verified "from" address                   |

## Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages →
   Connect to Git**, pick the repo.
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Settings → Environment variables** — add `RESEND_API_KEY`,
   `CONTACT_TO`, `CONTACT_FROM` (mark the API key as a *secret*).
5. **Custom domains** — add `jchen.me` and follow the DNS steps.

Every push to the default branch redeploys automatically.

### Resend setup

1. Create an account at [resend.com](https://resend.com) and an API key.
2. Add & verify your domain (`jchen.me`) under **Domains** — this lets you
   send from `hello@jchen.me` with good deliverability. Until then, the
   shared `onboarding@resend.dev` sender works for testing.
3. Free tier covers 3,000 emails/month (100/day) — ample for a contact form.
