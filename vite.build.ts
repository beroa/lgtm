import react from "@vitejs/plugin-react";
import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "vite";

const browser = process.argv[2];
if (browser !== "chrome" && browser !== "firefox") {
  throw new Error("Expected chrome or firefox");
}
const root = import.meta.dirname;
const outDir = resolve(root, "dist", browser);
await rm(outDir, { recursive: true, force: true });
for (const [name, input] of Object.entries({
  content: "src/content.ts",
  options: "pages/options.html",
})) {
  await build({
    root,
    configFile: false,
    plugins: [react()],
    resolve: { alias: { "@": resolve(root, "src") } },
    build: {
      outDir,
      emptyOutDir: false,
      target: "es2022",
      rollupOptions: {
        input: resolve(root, input),
        output: {
          entryFileNames: `pages/${name}.js`,
          chunkFileNames: "pages/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
          ...(name === "content"
            ? { format: "iife", inlineDynamicImports: true }
            : {}),
        },
      },
    },
  });
}
const manifestPath = resolve(outDir, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.version = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
).version;
if (browser === "firefox") {
  manifest.browser_specific_settings = {
    gecko: {
      id: "github-diff-collapser@lgtm.local",
      strict_min_version: "140.0",
      data_collection_permissions: { required: ["none"] },
    },
  };
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
