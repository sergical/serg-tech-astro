import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

import svelte from "@astrojs/svelte";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [svelte(), react()],
  adapter: cloudflare(),

  vite: {
    plugins: [tailwindcss()],
  },
});
