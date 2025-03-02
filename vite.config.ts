import { defineConfig } from "vite";

const config = defineConfig({
  base: '/js-mesh-editor',
});

console.info("Hello from vite with config: %o", config);

export default config;
