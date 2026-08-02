/** 結果の整形。ドメイン層は文言を持たない。 */

import type { ConversionResult, Direction } from "../domain/convert.js";
import { verifiedThrough } from "../domain/eras.js";
import type { PlainDate } from "../domain/plain-date.js";

export function formatDateJp(d: PlainDate): string {
  return `${d.year}年${d.month}月${d.day}日`;
}

/** 改元年の注記（要件 6-4）。同一年内の複数改元にも対応する。 */
export function transitionNotes(r: ConversionResult): string[] {
  return r.transitions.map(
    (t) =>
      `${t.year}年は${t.previousEraLastDay.month}月${t.previousEraLastDay.day}日までが` +
      `${t.previousEra.name}${t.previousEraYearLabel}年、` +
      `${t.nextEra.start.month}月${t.nextEra.start.day}日からが${t.nextEra.name}元年`,
  );
}

/** 確認期限を超える日付への警告注記（要件 6-5）。変換自体は成功している。 */
export function verificationNote(r: ConversionResult): string | null {
  if (!r.beyondVerified) return null;
  const v = verifiedThrough();
  return (
    `この日付は同梱の元号データ確認期限（${formatDateJp(v)}）より後です。` +
    `以降に改元があった場合、正しい和暦は異なります。`
  );
}

/** 主表示・副表示・注記。注記はコピー対象に含めない。 */
export function formatForPopup(
  r: ConversionResult,
  direction: Direction,
): { primary: string; secondary: string; notes: string[] } {
  const wareki = r.wareki;
  const gregorian = formatDateJp(r.gregorian);
  const primary = direction === "toWareki" ? wareki : gregorian;
  const secondary = direction === "toWareki" ? gregorian : wareki;

  const notes = [...transitionNotes(r)];
  const v = verificationNote(r);
  if (v) notes.push(v);

  return { primary, secondary, notes };
}

/** コピー対象は主表示＋副表示の2行のみ。注記を含めない（要件 7-1）。 */
export function formatForClipboard(r: ConversionResult, direction: Direction): string {
  const { primary, secondary } = formatForPopup(r, direction);
  return `${primary}\n${secondary}`;
}

/**
 * 通知は主表示のみ。注記は載せない（要件 7-2）。
 * 通知本文は OS により2行程度で切られるため、注記を入れると主表示が埋もれる。
 */
export function formatForNotification(
  r: ConversionResult,
  direction: Direction,
): { title: string; message: string } {
  const { primary, secondary } = formatForPopup(r, direction);
  return { title: primary, message: secondary };
}
