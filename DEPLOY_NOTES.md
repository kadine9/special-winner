Same instructions apply to both projects (`segment-scribe-suite` → ClipMaster Pro, `ocean-vault` → Ocean Vault).

## What changed
- Removed the Lovable-specific wrapper (`@lovable.dev/vite-tanstack-config`) from `vite.config.ts` and replaced it with the plain upstream plugins (`@tanstack/react-start/plugin/vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-tsconfig-paths`, `nitro/vite`), configured to build with Nitro's `cloudflare_pages` preset.
- Removed `.lovable/`, `AGENTS.md` (Lovable git-sync notice), `bun.lock` (generated against Lovable's private npm mirror — regenerate it locally), and all "Lovable" branding/text from metadata, error messages, and comments.
- Renamed `src/lib/lovable-error-reporting.ts` → `src/lib/error-reporting.ts` (generic `window.__errorReportingEvents` hook instead of Lovable's).
- Added `wrangler.toml` and a `deploy` script (`npm run deploy` / `bun run deploy`) using `wrangler pages deploy`.

## Deploying to Cloudflare Pages
1. Install deps: `npm install` (or `bun install` / `pnpm install`) — there's no committed lockfile anymore since the old one pointed at Lovable's private registry.
2. Set environment variables (locally in `.env`, and in the Cloudflare Pages dashboard for production): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, plus the `VITE_`-prefixed equivalents for client-side use.
3. Build: `npm run build`. This outputs static assets + a Pages Functions worker to `.output/public`.
4. Deploy:
   - Via CLI: `npx wrangler login` once, then `npm run deploy` (runs build + `wrangler pages deploy .output/public`).
   - Or connect the repo in the Cloudflare Pages dashboard with build command `npm run build` and output directory `.output/public`.
5. Update `name` in `wrangler.toml` if you want a different Pages project name.

Supabase migrations in `supabase/migrations/` are unaffected — apply them with the Supabase CLI as usual.
