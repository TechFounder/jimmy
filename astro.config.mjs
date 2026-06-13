import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  // Static by default; the contact endpoint opts into on-demand
  // rendering (prerender = false) so it runs as a Cloudflare function.
  output: "static",
  adapter: cloudflare({
    platformProxy: { enabled: true },
    // We use plain <img> tags, so no runtime image optimization is needed.
    imageService: "passthrough",
  }),
  // We don't use Astro sessions. Providing a trivial driver stops the
  // Cloudflare adapter from wiring up (and warning about) a KV "SESSION"
  // binding we'd otherwise never use.
  session: {
    driver: "memory",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
