import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

// Builds for Cloudflare Pages by default (via Nitro's `cloudflare_pages`
// preset, which emits .output/public + a Pages Functions worker).
// Override locally with `NITRO_PRESET=node-server vite build` etc. if you
// need a different target.
export default defineConfig({
  plugins: [
    viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Custom start entry: registers the Supabase auth middleware (see
      // src/start.ts) and the SSR error-handling middleware.
      start: { entry: "./src/start.ts" },
    }),
    viteReact(),
    tailwindcss(),
    nitro({
      preset: process.env.NITRO_PRESET ?? "cloudflare_pages",
    }),
  ],
  environments: {
    ssr: {
      build: {
        // Custom server entry (see src/server.ts): wraps the default
        // TanStack Start handler with SSR error normalization.
        rollupOptions: { input: "./src/server.ts" },
      },
    },
  },
});
