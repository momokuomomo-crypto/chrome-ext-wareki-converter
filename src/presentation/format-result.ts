/** 結果の整形。ドメイン層は文言を持たない。 */

import type { ConversionResult, Direction } from "../domain/convert.js";
import { verifiedThrough } from "../domain/eras.js";
import type { PlainDate } from "../domain/plain-date.js";
import { coversFullYear } from "../domain/year-span.js";

export function formatDateJp(d: PlainDate): string {
  return `${d.year}年${d.month}月${d.day}日`;
}

function monthDayJp(d: PlainDate): string {
  return `${d.month}月${d.day}日`;
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

/**
 * 和暦側の表示行。年だけの結果は元号年ごとに 1 行になる。
 *
 * 期間を併記するのは元号年が 2 つ以上あるときだけにする。1 つしかなければ
 * どの期間かを問う余地が無く、併記は情報を増やさずに行を長くするだけになる。
 */
function warekiLines(r: ConversionResult): string[] {
  if (r.kind === "date") return [r.wareki];

  const showSpan = r.segments.length > 1;
  return r.segments.map((s) => {
    const base = `${s.era.name}${s.eraYearLabel}年`;
    return showSpan ? `${base}（${monthDayJp(s.from)}〜${monthDayJp(s.to)}）` : base;
  });
}

/** 西暦側の表示行。年の一部しか覆わない場合だけ期間を書く。 */
function gregorianLines(r: ConversionResult): string[] {
  if (r.kind === "date") return [formatDateJp(r.gregorian)];
  if (coversFullYear(r.from, r.to)) return [`${r.gregorianYear}年`];
  return [`${r.gregorianYear}年${monthDayJp(r.from)}〜${monthDayJp(r.to)}`];
}

/** 主表示・副表示・注記。注記はコピー対象に含めない。 */
export function formatForPopup(
  r: ConversionResult,
  direction: Direction,
): { primaryLines: string[]; secondaryLines: string[]; notes: string[] } {
  const wareki = warekiLines(r);
  const gregorian = gregorianLines(r);

  const notes = [...transitionNotes(r)];
  const v = verificationNote(r);
  if (v) notes.push(v);

  return {
    primaryLines: direction === "toWareki" ? wareki : gregorian,
    secondaryLines: direction === "toWareki" ? gregorian : wareki,
    notes,
  };
}

/** コピー対象は主表示＋副表示のみ。注記を含めない（要件 7-1）。 */
export function formatForClipboard(r: ConversionResult, direction: Direction): string {
  const { primaryLines, secondaryLines } = formatForPopup(r, direction);
  return [...primaryLines, ...secondaryLines].join("\n");
}

/**
 * 通知は主表示のみ。注記は載せない（要件 7-2）。
 * 通知本文は OS により2行程度で切られるため、注記を入れると主表示が埋もれる。
 * 年だけの結果で複数行になる場合は 1 行へ畳む（通知は改行を保持しない）。
 */
export function formatForNotification(
  r: ConversionResult,
  direction: Direction,
): { title: string; message: string } {
  const { primaryLines, secondaryLines } = formatForPopup(r, direction);
  return { title: primaryLines.join("／"), message: secondaryLines.join("／") };
}
