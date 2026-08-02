import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * コア計算関数が時計を参照しないことを静的検索で担保する（凍結設計 5-1）。
 * API 設計（基準日を必ず引数で受け取る）だけでなく、実際に Date へ触れていない
 * ことをここで機械的に確認する。
 */
describe("domain 層は時計に触れない", () => {
  const dir = join(process.cwd(), "src", "domain");
  const files: string[] = readdirSync(dir).filter((f: string) => f.endsWith(".ts"));

  it("対象ファイルが存在する", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s に Date への参照が無い", (file: string) => {
    const text = readFileSync(join(dir, file), "utf8");
    const code = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(code).not.toMatch(/new\s+Date\s*\(/);
    expect(code).not.toMatch(/Date\.now\s*\(/);
    expect(code).not.toMatch(/\bchrome\./);
    expect(code).not.toMatch(/\bdocument\./);
  });
});
