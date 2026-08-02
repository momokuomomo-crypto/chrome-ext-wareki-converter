/**
 * 元号データ。**唯一の定義箇所。**
 *
 * 改元時はこのファイルへ 1 エントリ追加するだけで、以下がすべて追従する。
 * - 元号の解決・表示・期間検証（era.ts）
 * - 入力解析の正規表現（parse-date.ts が ERAS から動的生成する）
 * - 確認期限（verifiedThrough が最新元号の開始日から導出する）
 *
 * 姉妹拡張（年齢計算）からの**意図した差分**：
 * - `WAREKI_DISPLAY_HORIZON_YEARS = 100` を廃止した。
 *   これは最新元号を機械的に100年延長するもので、2119年まで「令和101年」を
 *   無警告で返していた。本拡張の「無警告で令和XX年を返さない」方針に反する。
 *   未来上限は verifiedThrough に一本化する（設計 6-6）。
 */

import type { PlainDate } from "./plain-date.js";

export type EraId = "meiji" | "taisho" | "showa" | "heisei" | "reiwa";

export type EraDefinition = Readonly<{
  id: EraId;
  name: string;
  abbreviation: string; // 大文字で保持する
  start: PlainDate;
}>;

/** 開始日の昇順。境界日は新元号側に含める。 */
export const ERAS: readonly EraDefinition[] = [
  { id: "meiji", name: "明治", abbreviation: "M", start: { year: 1868, month: 1, day: 25 } },
  { id: "taisho", name: "大正", abbreviation: "T", start: { year: 1912, month: 7, day: 30 } },
  { id: "showa", name: "昭和", abbreviation: "S", start: { year: 1926, month: 12, day: 25 } },
  { id: "heisei", name: "平成", abbreviation: "H", start: { year: 1989, month: 1, day: 8 } },
  { id: "reiwa", name: "令和", abbreviation: "R", start: { year: 2019, month: 5, day: 1 } },
] as const;

/**
 * 最新元号の開始日から何年先までを「同梱データで確認済み」とみなすか。
 *
 * **絶対日付をハードコードしない。**ERAS から導出することで、改元時に
 * 1 エントリ追加すれば確認期限も自動的に前進し、更新漏れで製品が壊れない
 * （既知不具合パターン1：時刻のハードコードの変種を避ける）。
 */
export const VERIFIED_YEARS_AFTER_LATEST_ERA = 30;

export function latestEra(): EraDefinition {
  const last = ERAS[ERAS.length - 1];
  if (!last) throw new Error("ERAS is empty");
  return last;
}

/** この日付までは同梱データで確認済み。これを超える日付には警告注記を付す（変換は行う）。 */
export function verifiedThrough(): PlainDate {
  return { year: latestEra().start.year + VERIFIED_YEARS_AFTER_LATEST_ERA, month: 12, day: 31 };
}
