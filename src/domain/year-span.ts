/**
 * 年だけの入力（`1901` `平成元年`）が指す期間の算出。
 *
 * 改元のあった年は 1 つの西暦年が複数の元号年にまたがるため、単一の値では表せない。
 * ここでは「元号年とそれが占める西暦上の期間」の並びとして表す。
 *
 * 当初は年だけの入力を一律で拒否していたが、その根拠（`1989年` の正解が
 * 昭和64年と平成元年の 2 つになる）が成立するのは改元のあった年だけであり、
 * 1901 年のように改元のない年まで巻き添えで拒否していた。しかも文言は
 * 「改元年は元号を一意に決められないため」と、その入力については誤っていた。
 *
 * 新規の暦計算は行わず、era.ts と plain-date.ts の組み合わせだけで求める。
 */

import { eraForDate, eraYearLabel, eraYearOf, gregorianYearOf, nextEra } from "./era.js";
import type { EraDefinition } from "./eras.js";
import { compare, nextDay, previousDay, type PlainDate } from "./plain-date.js";

export type EraYearSegment = Readonly<{
  era: EraDefinition;
  eraYear: number;
  /** 表示用ラベル。1 年目は「元」 */
  eraYearLabel: string;
  /** この元号年が占める西暦上の期間（両端を含む） */
  from: PlainDate;
  to: PlainDate;
}>;

function makeSegment(era: EraDefinition, from: PlainDate, to: PlainDate): EraYearSegment {
  const eraYear = eraYearOf(era, from);
  return { era, eraYear, eraYearLabel: eraYearLabel(eraYear), from, to };
}

/** 期間が西暦年の 1 月 1 日〜12 月 31 日を丸ごと覆うか。 */
export function coversFullYear(from: PlainDate, to: PlainDate): boolean {
  return from.month === 1 && from.day === 1 && to.month === 12 && to.day === 31;
}

/**
 * 西暦年を元号年の並びへ分解する。明治開始前を含む年では空配列を返す。
 *
 * 改元が 1 年に 2 回起きても、境界で切り続けるだけなので破綻しない。
 */
export function segmentsOfGregorianYear(year: number): readonly EraYearSegment[] {
  const yearEnd: PlainDate = { year, month: 12, day: 31 };
  const segments: EraYearSegment[] = [];
  let cursor: PlainDate = { year, month: 1, day: 1 };

  while (compare(cursor, yearEnd) <= 0) {
    const era = eraForDate(cursor);
    if (!era) return []; // 明治開始前が混じる年は対象外
    const next = nextEra(era);
    // eraForDate の性質上 next.start は必ず cursor より後。よって to >= cursor で停止する。
    const to = next && compare(next.start, yearEnd) <= 0 ? previousDay(next.start) : yearEnd;
    segments.push(makeSegment(era, cursor, to));
    cursor = nextDay(to);
  }
  return segments;
}

/**
 * 元号年が占める西暦上の期間。存在しない元号年（`昭和65年` など）では null。
 *
 * 元号年から西暦年を機械換算しただけでは受理しない。期間の始端は元号開始日、
 * 終端は次の元号開始日の前日で切り、始端が終端を追い越したら存在しないと判定する。
 */
export function segmentOfEraYear(era: EraDefinition, eraYear: number): EraYearSegment | null {
  if (!Number.isInteger(eraYear) || eraYear < 1) return null;

  const year = gregorianYearOf(era, eraYear);
  const yearStart: PlainDate = { year, month: 1, day: 1 };
  const yearEnd: PlainDate = { year, month: 12, day: 31 };

  const from = compare(era.start, yearStart) > 0 ? era.start : yearStart;
  const next = nextEra(era);
  const eraEnd = next ? previousDay(next.start) : null;
  const to = eraEnd && compare(eraEnd, yearEnd) < 0 ? eraEnd : yearEnd;

  if (compare(from, to) > 0) return null;
  return makeSegment(era, from, to);
}
