# serg-tech

Sergiy Dybskiy's personal site and blog, built with Astro, deployed to Cloudflare Workers.

## Dev commands

- `pnpm dev` or `pnpm start` — start the dev server at localhost:4321
- `pnpm build` — regenerate Cloudflare types, run `astro check`, and build the production site
- `pnpm preview` — preview the production build locally (via the Cloudflare Vite plugin)
- `pnpm types` — regenerate `worker-configuration.d.ts` from `wrangler.jsonc`
- `astro check` — TypeScript and Astro file checking

## Blog admin setup

The blog is backed by D1 (posts), KV (sessions), and Workers AI (voice transcription), with
Anthropic's API powering AI-assisted editing. Admin routes (`/admin*`, `/api/admin*`) are
protected by Cloudflare Access.

1. Create the D1 database and paste the returned id into `wrangler.jsonc` under
   `d1_databases[0].database_id`:
   ```
   pnpm exec wrangler d1 create serg-tech-blog
   ```
2. Apply migrations:
   ```
   pnpm exec wrangler d1 migrations apply serg-tech-blog --local   # local dev
   pnpm exec wrangler d1 migrations apply serg-tech-blog --remote  # production
   ```
3. Create a KV namespace for sessions and paste the id into `wrangler.jsonc` under
   `kv_namespaces[0].id`:
   ```
   pnpm exec wrangler kv namespace create SESSION
   ```
4. Set the Anthropic API key as a secret (used by `/api/admin/edit`):
   ```
   pnpm exec wrangler secret put ANTHROPIC_API_KEY
   ```
   For local development, copy `.dev.vars.example` to `.dev.vars` and fill in the key.
   `.dev.vars` is gitignored.
5. Create a Cloudflare Access application covering `serg.tech/admin*` and `serg.tech/api/admin*`.
   Put the Access team domain and the application's AUD tag into the `vars` section of
   `wrangler.jsonc` (`CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`). Until these are set, admin routes
   fail closed with a 503 in production. In local dev (`astro dev`), admin routes are open
   without Access, since there's no way to mint a Cloudflare Access JWT locally.
6. Workers AI (`@cf/openai/whisper-large-v3-turbo`, used by `/api/admin/transcribe`) always calls
   the remote Cloudflare API, even in local dev — there is no local emulation for it. Run
   `wrangler login` once so local dev and preview can authenticate.
