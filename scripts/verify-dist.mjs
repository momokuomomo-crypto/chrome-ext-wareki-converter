/**
 * ビルド後検査。Chrome Web Store 審査ポリシー（リモートコード不使用・最小権限）を
 * 機械的に守るための検査。凍結設計 4節。
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const DIST = "dist";
const EXPECTED_PERMISSIONS = ["contextMenus", "storage", "notifications"];
const failures = [];

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const files = await walk(DIST);

// 1. 外部URL参照が無いこと（リモートコード不使用）
for (const f of files.filter((f) => /\.(js|html|css|json)$/.test(f))) {
  const text = await readFile(f, "utf8");
  const hits = text.match(/https?:\/\/[^\s"'`)]+/g) ?? [];
  const external = hits.filter((u) => !u.startsWith("http://www.w3.org/"));
  if (external.length > 0) failures.push(`${f}: 外部URL参照 ${external.join(", ")}`);
  if (/\beval\s*\(/.test(text)) failures.push(`${f}: eval( を検出`);
  if (/new\s+Function\s*\(/.test(text)) failures.push(`${f}: new Function( を検出`);
}

// 2. manifest の権限が想定どおりであること
const manifest = JSON.parse(await readFile(join(DIST, "manifest.json"), "utf8"));
const perms = manifest.permissions ?? [];
for (const p of perms) {
  if (!EXPECTED_PERMISSIONS.includes(p)) failures.push(`manifest: 想定外の権限 ${p}`);
}
for (const p of EXPECTED_PERMISSIONS) {
  if (!perms.includes(p)) failures.push(`manifest: 権限 ${p} が無い`);
}
if (manifest.host_permissions) failures.push("manifest: host_permissions が存在する");
if (manifest.optional_host_permissions) failures.push("manifest: optional_host_permissions が存在する");
if (manifest.content_scripts) failures.push("manifest: content_scripts が存在する");

// 3. manifest の参照先が実在すること
const refs = [
  manifest.background?.service_worker,
  manifest.action?.default_popup,
  ...Object.values(manifest.icons ?? {}),
  ...Object.values(manifest.action?.default_icon ?? {}),
].filter(Boolean);
for (const r of new Set(refs)) {
  try {
    await stat(join(DIST, r));
  } catch {
    failures.push(`manifest: 参照先が存在しない ${r}`);
  }
}

// 4. name / description の長さ
if ((manifest.name ?? "").length > 45) failures.push("manifest: name が45文字を超える");
if ((manifest.description ?? "").length > 132) failures.push("manifest: description が132文字を超える");

// 5. 開発用ファイルが混入していないこと
for (const f of files) {
  if (/node_modules|\.test\.|\.map$|tsconfig|vitest/.test(f)) failures.push(`${f}: 開発用ファイルの混入`);
}

if (failures.length > 0) {
  console.error("verify:dist FAILED");
  for (const f of failures) console.error("  -", f);
  process.exit(1);
}
console.log("verify:dist OK （検査ファイル数:", files.length, "）");
