/**
 * 改元年の検出（要件 6-4）。
 *
 * 同じ西暦年が 2 つの元号にまたがる場合に、その事実を注記で示すための情報を返す。
 * 新規の暦計算は行わず、既存の関数の組み合わせだけで求める。
 */

import { eraForDate, eraYearLabel, eraYearOf } from "./era.js";
import { ERAS, type EraDefinition } from "./eras.js";
import { previousDay, type PlainDate } from "./plain-date.js";

export type EraTransition = Readonly<{
  year: number;
  previousEra: EraDefinition;
  /** 前の元号の最終日（＝新元号開始日の前日） */
  previousEraLastDay: PlainDate;
  /** 前の元号での元号年（表示用ラベル。「64」「45」など） */
  previousEraYearLabel: string;
  nextEra: EraDefinition;
}>;

/**
 * 対象年に起きた改元をすべて返す。空配列なら注記を出さない。
 *
 * 判定は「開始年が対象年」だけでは足りない。将来 1 月 1 日開始の元号が
 * 現れた場合、その年は前元号が前年 12 月 31 日で終わるため 1 元号しか
 * 含まないが、素朴な式では「2 元号にまたがる」と誤判定する。
 * そのため「前日も同じ年に属すること」を条件に加える。
 *
 * 同一年内に 2 回改元される事態に備え、条件に合う元号をすべて列挙する。
 */
export function transitionsInYear(year: number): readonly EraTransition[] {
  const result: EraTransition[] = [];
  for (const era of ERAS) {
    if (era.start.year !== year) continue;
    const lastDay = previousDay(era.start);
    if (lastDay.year !== year) continue; // 1月1日開始なら前日は前年 → 注記なし
    const prev = eraForDate(lastDay);
    if (!prev) continue; // 明治より前は対象外
    result.push({
      year,
      previousEra: prev,
      previousEraLastDay: lastDay,
      previousEraYearLabel: eraYearLabel(eraYearOf(prev, lastDay)),
      nextEra: era,
    });
  }
  return result;
}
