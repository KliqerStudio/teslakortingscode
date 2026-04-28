# TeslaKortingscode.com

Production-ready multilingual Next.js landing page for a Netherlands/Europe Tesla coupon and referral benefit guide.

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Static-first pages for Vercel
- Metadata API, Open Graph, Twitter metadata, sitemap, robots, FAQ JSON-LD
- No third-party copyrighted imagery; the EV hero visual is generated for this project and contains no Tesla logos.

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Copy `.env.example` to `.env.local` for local overrides:

```bash
NEXT_PUBLIC_SITE_URL=https://teslakortingscode.com
NEXT_PUBLIC_TESLA_REFERRAL_LINK=https://ts.la/tristan462970
NEXT_PUBLIC_TESLA_REFERRAL_CODE=tristan462970
NEXT_PUBLIC_TESLA_TERMS_URL=https://www.tesla.com/nl_nl/support/refer-and-earn
```

Set `NEXT_PUBLIC_SITE_URL` to the production domain on Vercel so canonical URLs, Open Graph URLs, `sitemap.xml`, and `robots.txt` point to the live site.

## Pages

- `/`
- `/en`
- `/tesla-referral-code-nederland`
- `/veelgestelde-vragen`
- `/disclaimer`
- `/privacy`
- `/en/faq`
- `/en/disclaimer`
- `/en/privacy`

## Production check

```bash
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
```
