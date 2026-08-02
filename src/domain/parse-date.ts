/**
 * 文字列 → PlainDate。西暦形式と和暦形式の双方を受理する。
 *
 * 方針：
 * - `Date.parse()` に依存しない
 * - 除去処理を通した後の文字列**全体**が許可形式に完全一致することを要求する
 * - 誤解釈より明示エラーを優先する
 *
 * 姉妹拡張（年齢計算）からの**意図した差分**：
 * 1. 候補数検査を **2 点**（正規化直後と全処理後）で行う。片方だけだと全角の
 *    2 日付入力が素通りする（JavaScript の `\d` は ASCII のみのため、NFKC 前の
 *    候補数が 0 件になる）
 * 2. 先頭ラベル除去の条件を強化（元号名を含むラベルを拒否、除去後の候補数を確認）
 * 3. 元号名・略号の列挙を `ERAS` から動的生成する（改元時の更新漏れを防ぐ）
 * 4. 年のみの入力を「年の範囲」として受理する（改元年は複数の元号年を返す）
 * 5. 存在しない和暦に「もしかして」提案を付す
 */

import { err, ok, type Result } from "./errors.js";
import {
  eraYearLabel,
  findEraByAbbreviation,
  findEraByName,
  gregorianYearOf,
  isWithinEra,
  nextEra,
} from "./era.js";
import { ERAS, type EraDefinition } from "./eras.js";
import {
  compare,
  isValidDate,
  makePlainDate,
  MIN_SUPPORTED_DATE,
  type PlainDate,
} from "./plain-date.js";
import { segmentOfEraYear, segmentsOfGregorianYear } from "./year-span.js";

export const MAX_INPUT_CODE_POINTS = 64;
/** ラベルとみなす接頭部の最大長 */
const MAX_LABEL_LENGTH = 12;
/** 許容する区切り記号（コロン）の数。これを超えたら日付以外の情報が多すぎる */
const MAX_COLONS = 1;

/** 元号名・略号は ERAS から生成する。正規表現へハードコードしない。 */
const ERA_NAMES = ERAS.map((e) => e.name).join("|");
const ERA_ABBRS = ERAS.map((e) => e.abbreviation).join("");

function codePointLength(s: string): number {
  return [...s].length;
}

/** 日付らしき並びの粗い検出。受理の判定には使わず、複数日付の検知だけに使う。 */
function dateLikeRegex(): RegExp {
  return new RegExp(
    `(?:${ERA_NAMES}|[${ERA_ABBRS}])?(?:元|\\d{1,4})[年/\\-.]\\d{1,2}[月/\\-.]\\d{1,2}`,
    "gu",
  );
}

export function countDateLike(s: string): number {
  return (s.match(dateLikeRegex()) ?? []).length;
}

/**
 * 年だけを表す並び（`1901` `1989年` `平成元年` `H1`）。
 *
 * 西暦の裸の数字は 4 桁のみ受理する。`5` のような 1〜3 桁を年とみなすと、
 * 打ち間違いを「明治5年以前は旧暦」という無関係な文言で返すことになる。
 * 3 桁以下は `年` を伴う場合だけ年として扱う。
 */
const GREGORIAN_YEAR_BARE = /^(\d{4})$/u;
const GREGORIAN_YEAR_JP = /^(\d{1,4})年$/u;

function eraYearOnlyJpRegex(): RegExp {
  return new RegExp(`^(${ERA_NAMES})(元|\\d{1,2})年$`, "u");
}
function eraYearOnlyAbbrRegex(): RegExp {
  return new RegExp(`^([${ERA_ABBRS}${ERA_ABBRS.toLowerCase()}])(元|\\d{1,2})年?$`, "u");
}

function containsEraName(s: string): boolean {
  return ERAS.some((e) => s.includes(e.name));
}

/**
 * 先頭ラベルの除去。**最初の**コロンより前を見る。
 *
 * 姉妹拡張では `lastIndexOf(":")` で最後のコロン以降を無条件に採用していたため、
 * `生年月日：1987年5月14日 登録日：2020年1月1日` が 2020 年の日付として
 * 無警告で受理されていた。完全一致検証を後段に置いても、前処理が先に情報を
 * 捨てるため防げない。
 */
function stripLeadingLabel(s: string): string {
  const colon = s.indexOf(":");
  if (colon < 0) return s;
  const label = s.slice(0, colon);
  const rest = s.slice(colon + 1);
  if (label.length > MAX_LABEL_LENGTH) return s;
  if (/\d/u.test(label)) return s;
  if (containsEraName(label)) return s; // `平成元年:1987年5月14日` の誤受理を塞ぐ
  if (countDateLike(rest) !== 1) return s; // 除去後にちょうど1件でなければ触らない
  return rest;
}

/** 正規化。順序が意味を持つ。 */
export function normalizeInput(raw: string): { normalized: string; afterNfkc: string } {
  // NFKC により全角コロン「：」は ASCII ":" へ変換済みになる
  const afterNfkc = raw.normalize("NFKC").trim();

  let s = stripLeadingLabel(afterNfkc);
  s = s.replace(/[(（][日月火水木金土][)）]/g, "");

  // 末尾の補助語と約物は重なって現れる（「…日（木）生まれ。」）。安定するまで剥がす。
  for (;;) {
    const before = s;
    s = s.trim();
    s = s.replace(/(生まれ|出生|生)$/u, "");
    s = s.replace(/[、。,.]+$/u, "");
    if (s === before) break;
  }

  s = s.replace(/\s+/gu, "").trim();
  return { normalized: s, afterNfkc };
}

/** 区切り記号は前後で同一であることを要求する（`1989/1-8` を受理しない） */
const GREGORIAN_SEPARATED = /^(\d{4})([/\-.])(\d{1,2})\2(\d{1,2})$/u;
const GREGORIAN_JP = /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/u;

function eraJpRegex(): RegExp {
  return new RegExp(`^(${ERA_NAMES})(元|\\d{1,2})年(\\d{1,2})月(\\d{1,2})日?$`, "u");
}
function eraAbbrRegex(): RegExp {
  return new RegExp(`^([${ERA_ABBRS}${ERA_ABBRS.toLowerCase()}])(元|\\d{1,2})([/\\-.])(\\d{1,2})\\3(\\d{1,2})$`, "u");
}

function eraYearToNumber(token: string): number {
  return token === "元" ? 1 : Number(token);
}

function jp(year: number, month: number, day: number): string {
  return `${year}年${month}月${day}日`;
}

/** 入力がどちらの体系で書かれていたか。表示の主従を決めるために使う。 */
export type InputKind = "gregorian" | "wareki";

/**
 * 解析結果。年月日そろった入力と、年だけの入力を区別する。
 *
 * 年だけの入力をここで日付へ丸めない。`1989` を 1 月 1 日とみなすような
 * 補完は、改元年でどちらの元号を選ぶかという判断を暗黙に行うことになる。
 */
export type ParsedInput =
  | Readonly<{ kind: "date"; date: PlainDate; inputKind: InputKind }>
  | Readonly<{ kind: "gregorianYear"; year: number; inputKind: "gregorian" }>
  | Readonly<{ kind: "eraYear"; era: EraDefinition; eraYear: number; inputKind: "wareki" }>;

function buildFromGregorian(year: number, month: number, day: number): Result<ParsedInput> {
  if (!isValidDate(year, month, day)) return err("NONEXISTENT_DATE", jp(year, month, day));
  const date = makePlainDate(year, month, day);
  if (!date) return err("NONEXISTENT_DATE", jp(year, month, day));
  if (compare(date, MIN_SUPPORTED_DATE) < 0) return err("BELOW_MIN_DATE");
  return ok({ kind: "date", date, inputKind: "gregorian" });
}

function buildFromEra(
  era: EraDefinition,
  eraYear: number,
  month: number,
  day: number,
): Result<ParsedInput> {
  if (eraYear < 1) return err("UNPARSABLE");
  const year = gregorianYearOf(era, eraYear);
  const label = `${era.name}${eraYearLabel(eraYear)}年${month}月${day}日`;

  if (!isValidDate(year, month, day)) return err("NONEXISTENT_DATE", label);
  const date = makePlainDate(year, month, day);
  if (!date) return err("UNPARSABLE");

  // 旧暦由来の範囲外は、元号期間の文言より「旧暦のため非対応」を優先する
  if (compare(date, MIN_SUPPORTED_DATE) < 0) return err("BELOW_MIN_DATE");

  // 元号年を西暦へ機械換算しただけでは受理しない。期間内かを必ず検証する。
  if (!isWithinEra(era, date)) {
    const next = nextEra(era);
    const startText = `${era.name}は${jp(era.start.year, era.start.month, era.start.day)}開始`;
    const endText = next
      ? `、${next.name}は${jp(next.start.year, next.start.month, next.start.day)}開始`
      : "";
    // もしかして提案（要件 6-9）：機械換算した西暦が実在日なら正解を示す
    const actualEra = ERAS.filter((e) => compare(e.start, date) <= 0).at(-1);
    const suggestion = actualEra
      ? `この日付は ${actualEra.name}${eraYearLabel(date.year - actualEra.start.year + 1)}年${date.month}月${date.day}日 です。`
      : undefined;
    return err("ERA_OUT_OF_RANGE", `${label}は${era.name}の期間外です。${startText}${endText}です。`, suggestion);
  }

  return ok({ kind: "date", date, inputKind: "wareki" });
}

function buildFromGregorianYear(year: number): Result<ParsedInput> {
  // 年内に一部でも旧暦期間を含むなら受理しない（1872 年以前）
  if (year < MIN_SUPPORTED_DATE.year) return err("BELOW_MIN_DATE");
  return ok({ kind: "gregorianYear", year, inputKind: "gregorian" });
}

function buildFromEraYear(era: EraDefinition, eraYear: number): Result<ParsedInput> {
  if (eraYear < 1) return err("UNPARSABLE");

  const segment = segmentOfEraYear(era, eraYear);
  const label = `${era.name}${eraYearLabel(eraYear)}年`;

  if (!segment) {
    const next = nextEra(era);
    const startText = `${era.name}は${jp(era.start.year, era.start.month, era.start.day)}開始`;
    const endText = next
      ? `、${next.name}は${jp(next.start.year, next.start.month, next.start.day)}開始`
      : "";
    // もしかして提案（要件 6-9）：機械換算した西暦年の実際の元号年を示す
    const actual = segmentsOfGregorianYear(gregorianYearOf(era, eraYear));
    const suggestion =
      actual.length > 0
        ? `この年は ${actual.map((s) => `${s.era.name}${s.eraYearLabel}年`).join("・")} です。`
        : undefined;
    return err("ERA_OUT_OF_RANGE", `${label}は${era.name}の期間外です。${startText}${endText}です。`, suggestion);
  }

  // 旧暦由来の範囲外は、元号期間の文言より「旧暦のため非対応」を優先する
  if (compare(segment.to, MIN_SUPPORTED_DATE) < 0) return err("BELOW_MIN_DATE");

  return ok({ kind: "eraYear", era, eraYear, inputKind: "wareki" });
}

export function parseDateInput(raw: string): Result<ParsedInput> {
  const trimmed = raw.trim();
  if (trimmed === "") return err("EMPTY_INPUT");
  if (codePointLength(trimmed) > MAX_INPUT_CODE_POINTS) return err("TOO_LONG");

  const { normalized, afterNfkc } = normalizeInput(raw);
  if (normalized === "") return err("EMPTY_INPUT");

  // 候補数は 2 点で数える。片方だけだと全角の 2 日付入力が素通りする。
  // **区切り過多より先に判定する。**日付が2件あるなら「1件だけ指定してください」の方が
  // 「日付以外の文字が多い」より具体的で、ユーザーが誤りに気づきやすい。
  const before = countDateLike(afterNfkc);
  const after = countDateLike(normalized);
  if (Math.max(before, after) >= 2) return err("MULTIPLE_DATES");

  // 日付が1件以下なのに区切りが多い場合（`メモ:日付:1989/1/8`）は別コードにする。
  if ((afterNfkc.match(/:/gu) ?? []).length > MAX_COLONS) return err("TOO_MANY_SEPARATORS");

  // 年だけの入力。日付形式より先に判定する（月日を欠く形は互いに衝突しない）。
  let m = GREGORIAN_YEAR_BARE.exec(normalized) ?? GREGORIAN_YEAR_JP.exec(normalized);
  if (m) return buildFromGregorianYear(Number(m[1]));

  m = eraYearOnlyJpRegex().exec(normalized);
  if (m) {
    const era = findEraByName(m[1] as string);
    if (!era) return err("UNPARSABLE");
    return buildFromEraYear(era, eraYearToNumber(m[2] as string));
  }

  m = eraYearOnlyAbbrRegex().exec(normalized);
  if (m) {
    const era = findEraByAbbreviation(m[1] as string);
    if (!era) return err("UNPARSABLE");
    return buildFromEraYear(era, eraYearToNumber(m[2] as string));
  }

  m = GREGORIAN_SEPARATED.exec(normalized);
  if (m) return buildFromGregorian(Number(m[1]), Number(m[3]), Number(m[4]));

  m = GREGORIAN_JP.exec(normalized);
  if (m) return buildFromGregorian(Number(m[1]), Number(m[2]), Number(m[3]));

  m = eraJpRegex().exec(normalized);
  if (m) {
    const era = findEraByName(m[1] as string);
    if (!era) return err("UNPARSABLE");
    return buildFromEra(era, eraYearToNumber(m[2] as string), Number(m[3]), Number(m[4]));
  }

  m = eraAbbrRegex().exec(normalized);
  if (m) {
    const era = findEraByAbbreviation(m[1] as string);
    if (!era) return err("UNPARSABLE");
    return buildFromEra(era, eraYearToNumber(m[2] as string), Number(m[4]), Number(m[5]));
  }

  return err("UNPARSABLE");
}
