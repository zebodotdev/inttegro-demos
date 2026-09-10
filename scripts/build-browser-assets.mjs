import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const destinations = {
  nextjs: "nextjs/public",
  express: "express/public",
  nuxt: "nuxt/public",
  go: "go/static",
  django: "django/src/checkout/static/checkout",
  fastapi: "fastapi/public/static",
  rails: "rails/public",
  laravel: "laravel/public",
  "spring-boot": "spring-boot/src/main/resources/static",
  nestjs: "nestjs/public",
  redwoodsdk: "redwoodsdk/public",
  astro: "astro/public",
};

await build({
  entryPoints: [join(root, "assets/inttegro-loader.entry.js")],
  bundle: true,
  format: "esm",
  outfile: join(root, "assets/inttegro-loader.js"),
  platform: "browser",
  minify: true,
  sourcemap: false,
  target: ["es2022"],
});

for (const directory of Object.values(destinations)) {
  const destination = join(root, directory);
  await mkdir(destination, { recursive: true });
  await Promise.all(
    [
      "checkout-presentations.css",
      "checkout-presentations.js",
      "inttegro-loader.js",
    ].map((asset) =>
      copyFile(join(root, "assets", asset), join(destination, asset)),
    ),
  );
}

console.log(
  `Built @inttegro/js browser loader and synchronized ${Object.keys(destinations).length} server demos.`,
);
