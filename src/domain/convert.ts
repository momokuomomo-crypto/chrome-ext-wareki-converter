/** 双方向変換の入口。ドメイン層の各関数を束ねる。 */

import { formatWareki } from "./era.js";
import { transitionsInYear, type EraTransition } from "./era-transition.js";
import { verifiedThrough } from "./eras.js";
import { err, ok, type Result } from "./errors.js";
import { parseDateInput, type InputKind } from "./parse-date.js";
import { compare, type PlainDate } from "./plain-date.js";
import { segmentOfEraYear, segmentsOfGregorianYear, type EraYearSegment } from "./year-span.js";

/** 主表示をどちらにするか。既定は和暦（主機能が西暦→和暦のため）。 */
export type Direction = "toWareki" | "toGregorian";

type Common = Readonly<{
  inputKind: InputKind;
  /** 改元年なら要素が入る。空なら注記を出さない。 */
  transitions: readonly EraTransition[];
  /** 同梱データの確認期限を超えているか。true でも変換は成功している。 */
  beyondVerified: boolean;
}>;

/**
 * 変換結果。年月日そろった入力と、年だけの入力で形が異なる。
 *
 * 年だけの結果を「1 月 1 日の日付」に丸めない。改元年ではどちらの元号年も
 * 等しく正解であり、片方を選んだ時点で本拡張の主目的（境界を能動的に示す）を
 * 損なう。複数の元号年を持てる形にしてある。
 */
export type ConversionResult =
  | (Common &
      Readonly<{
        kind: "date";
        gregorian: PlainDate;
        wareki: string;
      }>)
  | (Common &
      Readonly<{
        kind: "year";
        gregorianYear: number;
        /** 1 件とは限らない。改元年は 2 件以上になる。 */
        segments: readonly EraYearSegment[];
        /** segments 全体が覆う西暦上の期間 */
        from: PlainDate;
        to: PlainDate;
      }>);

export function convert(raw: string): Result<ConversionResult> {
  const parsed = parseDateInput(raw);
  if (!parsed.ok) return parsed;
  const input = parsed.value;

  if (input.kind === "date") {
    const wareki = formatWareki(input.date);
    // MIN_SUPPORTED_DATE（1873-01-01）以降は必ず元号が定まるため、通常ここは通らない
    if (!wareki) return err("BELOW_MIN_DATE");

    return ok({
      kind: "date",
      gregorian: input.date,
      wareki,
      inputKind: input.inputKind,
      transitions: transitionsInYear(input.date.year),
      // 確認期限は双方向に適用する。最新元号には次が無いため isWithinEra では検出できない。
      beyondVerified: compare(input.date, verifiedThrough()) > 0,
    });
  }

  const segments =
    input.kind === "gregorianYear"
      ? segmentsOfGregorianYear(input.year)
      : [segmentOfEraYear(input.era, input.eraYear)].filter((s) => s !== null);

  const first = segments[0];
  const last = segments[segments.length - 1];
  // parse 層で弾いているため通常ここは通らない
  if (!first || !last) return err("BELOW_MIN_DATE");

  return ok({
    kind: "year",
    gregorianYear: first.from.year,
    segments,
    from: first.from,
    to: last.to,
    inputKind: input.inputKind,
    transitions: transitionsInYear(first.from.year),
    beyondVerified: compare(last.to, verifiedThrough()) > 0,
  });
}
