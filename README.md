# serg-tech

Sergiy Dybskiy's personal site and blog, built with Astro, deployed to Cloudflare Workers.

## Dev commands

- `pnpm dev` or `pnpm start` — start the dev server at localhost:4321
- `pnpm build` — regenerate Cloudflare types, run `astro check`, and build the production site
- `pnpm preview` — preview the production build locally (via the Cloudflare Vite plugin)
- `pnpm types` — regenerate `worker-configuration.d.ts` from `wrangler.jsonc`
- `astro check` — TypeScript and Astro file checking

## Deploy

The site deploys as the Worker `serg-tech` with custom domains `serg.tech` and `www.serg.tech`
(see `routes` in `wrangler.jsonc`). There is no CI deploy; run it from your machine:

```
pnpm build && pnpm exec wrangler deploy
```

## Blog admin

The blog is backed by D1 (posts), KV (sessions), and Workers AI (Whisper for voice
transcription, Kimi K2.6 for AI-assisted editing). No external API keys are needed. Admin routes (`/admin*`, `/api/admin*`) are
protected by Cloudflare Access.

Everything is provisioned and its ids live in `wrangler.jsonc`: D1 `serg-tech-blog`, KV
`SESSION`, the Workers AI binding, and the Access application "serg.tech admin"
(`sergtech.cloudflareaccess.com`, one-time PIN for the owner email).

Per-machine and per-secret steps:

- Local database: `pnpm exec wrangler d1 migrations apply serg-tech-blog --local`
- New migration: add `migrations/NNNN_name.sql`, apply with `--local`, then `--remote`

In `astro dev` the Access check is bypassed; the Workers AI binding calls the remote model.
