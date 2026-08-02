/** 元号の解決・表示・期間検証。境界日は eras.ts のみを参照する。 */

import { ERAS, type EraDefinition } from "./eras.js";
import { compare, isSameOrBefore, type PlainDate } from "./plain-date.js";

/** 対象日が属する元号。明治開始前は null。 */
export function eraForDate(date: PlainDate): EraDefinition | null {
  let found: EraDefinition | null = null;
  for (const era of ERAS) {
    if (isSameOrBefore(era.start, date)) found = era;
    else break; // ERAS は開始日昇順
  }
  return found;
}

export function findEraByName(name: string): EraDefinition | undefined {
  return ERAS.find((e) => e.name === name);
}

export function findEraByAbbreviation(abbr: string): EraDefinition | undefined {
  const upper = abbr.toUpperCase();
  return ERAS.find((e) => e.abbreviation === upper);
}

/** その元号の次の元号。最後の元号なら undefined。 */
export function nextEra(era: EraDefinition): EraDefinition | undefined {
  const i = ERAS.findIndex((e) => e.id === era.id);
  return i >= 0 ? ERAS[i + 1] : undefined;
}

/** date がその元号の期間内か。終了日は次の元号の開始日から導出する。 */
export function isWithinEra(era: EraDefinition, date: PlainDate): boolean {
  if (compare(date, era.start) < 0) return false;
  const next = nextEra(era);
  if (!next) return true; // 最新元号には終わりが無い。確認期限は別途 convert.ts で判定する
  return compare(date, next.start) < 0;
}

/** 元号年（1 起算）。1 年目は「元年」と表記する。 */
export function eraYearOf(era: EraDefinition, date: PlainDate): number {
  return date.year - era.start.year + 1;
}

export function eraYearLabel(eraYear: number): string {
  return eraYear === 1 ? "元" : String(eraYear);
}

/** 元号年から西暦年を求める。期間内かどうかは呼び出し側で検証すること。 */
export function gregorianYearOf(era: EraDefinition, eraYear: number): number {
  return era.start.year + eraYear - 1;
}

/**
 * 和暦表示。明治開始前のみ null を返す。
 *
 * 姉妹拡張にあった「最新元号の開始から100年を超えたら null」という上限は
 * 設けない。確認期限を超える日付は変換したうえで警告注記を付す（設計 6-5）。
 */
export function formatWareki(date: PlainDate): string | null {
  const era = eraForDate(date);
  if (!era) return null;
  return `${era.name}${eraYearLabel(eraYearOf(era, date))}年${date.month}月${date.day}日`;
}
