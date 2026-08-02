import { describe, expect, it } from "vitest";
import { eraForDate, formatWareki, isWithinEra } from "../../src/domain/era.js";
import { ERAS, verifiedThrough, VERIFIED_YEARS_AFTER_LATEST_ERA, latestEra } from "../../src/domain/eras.js";
import { previousDay } from "../../src/domain/plain-date.js";

const d = (y: number, m: number, day: number) => ({ year: y, month: m, day });

describe("元号の境界日（要件 6-1）", () => {
  it.each([
    [d(1912, 7, 29), "明治45年7月29日"],
    [d(1912, 7, 30), "大正元年7月30日"],
    [d(1926, 12, 24), "大正15年12月24日"],
    [d(1926, 12, 25), "昭和元年12月25日"],
    [d(1989, 1, 7), "昭和64年1月7日"],
    [d(1989, 1, 8), "平成元年1月8日"],
    [d(2019, 4, 30), "平成31年4月30日"],
    [d(2019, 5, 1), "令和元年5月1日"],
  ])("%o -> %s", (date, expected) => expect(formatWareki(date)).toBe(expected));

  it("全元号で開始日前日と開始日が切り替わる", () => {
    for (let i = 1; i < ERAS.length; i++) {
      const era = ERAS[i]!, prev = ERAS[i - 1]!;
      expect(eraForDate(era.start)?.id).toBe(era.id);
      expect(eraForDate(previousDay(era.start))?.id).toBe(prev.id);
    }
  });

  it("元号の期間検証", () => {
    const heisei = ERAS.find((e) => e.id === "heisei")!;
    const showa = ERAS.find((e) => e.id === "showa")!;
    expect(isWithinEra(heisei, d(1989, 1, 7))).toBe(false);
    expect(isWithinEra(heisei, d(1989, 1, 8))).toBe(true);
    expect(isWithinEra(heisei, d(2019, 5, 1))).toBe(false);
    expect(isWithinEra(showa, d(1989, 1, 8))).toBe(false);
  });

  it("最新元号を機械的に100年延長しない（姉妹拡張との意図した差分）", () => {
    // 姉妹拡張は 2119 年まで「令和101年」を返していた。本拡張は上限を持たず、
    // 確認期限の超過は convert 側で警告として扱う。
    expect(formatWareki(d(2119, 5, 1))).toBe("令和101年5月1日");
    expect(formatWareki(d(2500, 1, 1))).toBe("令和482年1月1日");
  });

  it("明治開始前は和暦を出せない", () => {
    expect(formatWareki(d(1868, 1, 24))).toBeNull();
  });
});

describe("確認期限は ERAS から導出する（絶対日付をハードコードしない）", () => {
  it("最新元号の開始年 + VERIFIED_YEARS_AFTER_LATEST_ERA", () => {
    const v = verifiedThrough();
    expect(v.year).toBe(latestEra().start.year + VERIFIED_YEARS_AFTER_LATEST_ERA);
    expect(v.month).toBe(12);
    expect(v.day).toBe(31);
  });
});
