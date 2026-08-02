/**
 * 年月日だけを持つ値オブジェクト。
 * JavaScript の Date は使わない（タイムゾーンと時刻の概念が混入するため）。
 * このモジュールは chrome / DOM / 時計 / storage のいずれも参照しない。
 */

export type PlainDate = Readonly<{
  year: number;
  month: number; // 1-12
  day: number;
}>;

/**
 * 入力の下限。明治5年以前は旧暦のため元号年→西暦の機械換算が成立しない。
 *
 * 未来方向の上限は持たない。姉妹拡張にあった MAX_REFERENCE_DATE は
 * パーサーから参照されない死んだ定数だったため移植時に廃止した
 * （設計 6-6：未来上限は verifiedThrough に一本化する）。
 */
export const MIN_SUPPORTED_DATE: PlainDate = { year: 1873, month: 1, day: 1 };

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export function daysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return DAYS_IN_MONTH[month - 1] ?? 0;
}

/** グレゴリオ暦上で実在する日付かどうか。整数性も検査する。 */
export function isValidDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  return day <= daysInMonth(year, month);
}

/** 実在しない日付では null を返す。例外は投げない。 */
export function makePlainDate(year: number, month: number, day: number): PlainDate | null {
  if (!isValidDate(year, month, day)) return null;
  return { year, month, day };
}

/** a < b なら負、a === b なら 0、a > b なら正 */
export function compare(a: PlainDate, b: PlainDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function isBefore(a: PlainDate, b: PlainDate): boolean {
  return compare(a, b) < 0;
}

export function isSameOrBefore(a: PlainDate, b: PlainDate): boolean {
  return compare(a, b) <= 0;
}

export function equals(a: PlainDate, b: PlainDate): boolean {
  return compare(a, b) === 0;
}

export function previousDay(d: PlainDate): PlainDate {
  if (d.day > 1) return { year: d.year, month: d.month, day: d.day - 1 };
  if (d.month > 1) {
    const month = d.month - 1;
    return { year: d.year, month, day: daysInMonth(d.year, month) };
  }
  return { year: d.year - 1, month: 12, day: 31 };
}

export function nextDay(d: PlainDate): PlainDate {
  if (d.day < daysInMonth(d.year, d.month)) {
    return { year: d.year, month: d.month, day: d.day + 1 };
  }
  if (d.month < 12) return { year: d.year, month: d.month + 1, day: 1 };
  return { year: d.year + 1, month: 1, day: 1 };
}

/** YYYY-MM-DD 形式へ。storage と <input type="date"> の受け渡しに使う。 */
export function toISO(d: PlainDate): string {
  const mm = String(d.month).padStart(2, "0");
  const dd = String(d.day).padStart(2, "0");
  return `${d.year}-${mm}-${dd}`;
}

/** YYYY-MM-DD 形式から。厳密一致のみ受理する。 */
export function fromISO(s: string): PlainDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return makePlainDate(Number(m[1]), Number(m[2]), Number(m[3]));
}
