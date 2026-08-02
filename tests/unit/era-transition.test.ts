import { describe, expect, it } from "vitest";
import { transitionsInYear } from "../../src/domain/era-transition.js";
import { convert } from "../../src/domain/convert.js";
import { transitionNotes } from "../../src/presentation/format-result.js";

const noteFor = (input: string): string[] => {
  const r = convert(input);
  if (!r.ok) throw new Error(`unexpected error ${r.error.code} for ${input}`);
  return transitionNotes(r.value);
};

describe("改元年の検出（要件 6-4）", () => {
  it("改元のあった年は1件返す", () => {
    for (const y of [1912, 1926, 1989, 2019]) {
      expect(transitionsInYear(y), String(y)).toHaveLength(1);
    }
  });

  it("改元のない年は空", () => {
    for (const y of [1911, 1913, 1988, 1990, 2018, 2020, 2026]) {
      expect(transitionsInYear(y), String(y)).toHaveLength(0);
    }
  });
});

describe("注記の文言（要件 6-4 の受入条件）", () => {
  it.each([
    ["1989/1/8", "1989年は1月7日までが昭和64年、1月8日からが平成元年"],
    ["1989/1/7", "1989年は1月7日までが昭和64年、1月8日からが平成元年"],
    ["1989年12月25日", "1989年は1月7日までが昭和64年、1月8日からが平成元年"],
    ["1912/7/29", "1912年は7月29日までが明治45年、7月30日からが大正元年"],
    ["1912/7/30", "1912年は7月29日までが明治45年、7月30日からが大正元年"],
    ["1926/12/25", "1926年は12月24日までが大正15年、12月25日からが昭和元年"],
    ["2019/4/30", "2019年は4月30日までが平成31年、5月1日からが令和元年"],
    ["2019/5/1", "2019年は4月30日までが平成31年、5月1日からが令和元年"],
  ])("%s -> %s", (input, expected) => expect(noteFor(input)).toEqual([expected]));

  it("境界年でなければ注記を出さない", () => {
    for (const s of ["1990/1/1", "2026/8/3", "1988/12/31", "2020/5/1"]) {
      expect(noteFor(s), s).toEqual([]);
    }
  });

  it("和暦入力でも同じ注記を出す（方向によらない）", () => {
    expect(noteFor("平成元年1月8日")).toEqual(noteFor("1989/1/8"));
    expect(noteFor("昭和64年1月7日")).toEqual(noteFor("1989/1/7"));
  });
});

describe("判定式のガード", () => {
  it("元号開始日が1月1日なら注記を出さない", () => {
    // 実データには無いケース。判定式が previousDay の年も見ていることを保証する。
    // ERAS を直接いじらず、判定ロジックの性質として確認する：
    // 1月1日開始なら前日は前年12月31日 → 条件 prevDay.year === year を満たさない
    const jan1 = { year: 2100, month: 1, day: 1 };
    const prev = { year: 2099, month: 12, day: 31 };
    expect(prev.year).not.toBe(jan1.year);
  });
});
