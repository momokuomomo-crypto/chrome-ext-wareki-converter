/** 双方向変換の入口。ドメイン層の各関数を束ねる。 */

import { formatWareki } from "./era.js";
import { transitionsInYear, type EraTransition } from "./era-transition.js";
import { verifiedThrough } from "./eras.js";
import { err, ok, type Result } from "./errors.js";
import { parseDateInput, type InputKind } from "./parse-date.js";
import { compare, type PlainDate } from "./plain-date.js";

/** 主表示をどちらにするか。既定は和暦（主機能が西暦→和暦のため）。 */
export type Direction = "toWareki" | "toGregorian";

export type ConversionResult = Readonly<{
  gregorian: PlainDate;
  wareki: string;
  inputKind: InputKind;
  /** 改元年なら要素が入る。空なら注記を出さない。 */
  transitions: readonly EraTransition[];
  /** 同梱データの確認期限を超えているか。true でも変換は成功している。 */
  beyondVerified: boolean;
}>;

export function convert(raw: string): Result<ConversionResult> {
  const parsed = parseDateInput(raw);
  if (!parsed.ok) return parsed;

  const { date, inputKind } = parsed.value;
  const wareki = formatWareki(date);
  // MIN_SUPPORTED_DATE（1873-01-01）以降は必ず元号が定まるため、通常ここは通らない
  if (!wareki) return err("BELOW_MIN_DATE");

  return ok({
    gregorian: date,
    wareki,
    inputKind,
    transitions: transitionsInYear(date.year),
    // 確認期限は双方向に適用する。最新元号には次が無いため isWithinEra では検出できない。
    beyondVerified: compare(date, verifiedThrough()) > 0,
  });
}
