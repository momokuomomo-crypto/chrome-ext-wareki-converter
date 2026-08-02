/** esbuild によるバンドル。外部URL参照を持ち込まないよう、依存はすべて同梱する。 */
import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

const outdir = "dist";

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

await build({
  entryPoints: {
    "service-worker": "src/background/service-worker.ts",
    popup: "src/popup/popup.ts",
  },
  outdir,
  bundle: true,
  format: "esm",
  target: "chrome116",
  platform: "browser",
  minify: false,
  sourcemap: false, // ストア提出物にソースマップを含めない
  legalComments: "none",
});

await cp("src/manifest.json", `${outdir}/manifest.json`);
await cp("src/popup/popup.html", `${outdir}/popup.html`);
await cp("src/popup/popup.css", `${outdir}/popup.css`);
await cp("icons", `${outdir}/icons`, { recursive: true });

console.log("build: done ->", outdir);
