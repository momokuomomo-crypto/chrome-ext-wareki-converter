import { describe, expect, it } from "vitest";
import { findEraByName } from "../../src/domain/era.js";
import { ERAS } from "../../src/domain/eras.js";
import {
  coversFullYear,
  segmentOfEraYear,
  segmentsOfGregorianYear,
} from "../../src/domain/year-span.js";

const era = (name: string) => {
  const e = findEraByName(name);
  if (!e) throw new Error(`unknown era: ${name}`);
  return e;
};
const label = (year: number) =>
  segmentsOfGregorianYear(year).map((s) => `${s.era.name}${s.eraYearLabel}年`);

describe("西暦年 → 元号年の並び", () => {
  it("改元の無い年は1件", () => {
    expect(label(1901)).toEqual(["明治34年"]);
    expect(label(2000)).toEqual(["平成12年"]);
  });

  it("改元のあった年は2件", () => {
    expect(label(1912)).toEqual(["明治45年", "大正元年"]);
    expect(label(1926)).toEqual(["大正15年", "昭和元年"]);
    expect(label(1989)).toEqual(["昭和64年", "平成元年"]);
    expect(label(2019)).toEqual(["平成31年", "令和元年"]);
  });

  it("境界日は新元号側に含める", () => {
    const [prev, next] = segmentsOfGregorianYear(1989);
    expect(prev?.to).toEqual({ year: 1989, month: 1, day: 7 });
    expect(next?.from).toEqual({ year: 1989, month: 1, day: 8 });
  });

  it("並びは隙間なく年を覆う", () => {
    for (const era of ERAS) {
      const segments = segmentsOfGregorianYear(era.start.year);
      if (segments.length === 0) continue; // 明治開始年は旧暦のため対象外
      const first = segments[0];
      const last = segments[segments.length - 1];
      expect(first?.from).toEqual({ year: era.start.year, month: 1, day: 1 });
      expect(last?.to).toEqual({ year: era.start.year, month: 12, day: 31 });
    }
  });

  it("明治開始前を含む年は空", () => {
    expect(segmentsOfGregorianYear(1867)).toEqual([]);
    expect(segmentsOfGregorianYear(1868)).toEqual([]); // 1月25日開始のため年頭が範囲外
  });
});

describe("元号年 → 西暦上の期間", () => {
  it("改元年の前側は年頭から改元前日まで", () => {
    const s = segmentOfEraYear(era("昭和"), 64);
    expect(s?.from).toEqual({ year: 1989, month: 1, day: 1 });
    expect(s?.to).toEqual({ year: 1989, month: 1, day: 7 });
  });

  it("元年は改元日から年末まで", () => {
    const s = segmentOfEraYear(era("平成"), 1);
    expect(s?.from).toEqual({ year: 1989, month: 1, day: 8 });
    expect(s?.to).toEqual({ year: 1989, month: 12, day: 31 });
  });

  it("途中の年は丸ごと1年", () => {
    const s = segmentOfEraYear(era("明治"), 34);
    expect(s?.from).toEqual({ year: 1901, month: 1, day: 1 });
    expect(s?.to).toEqual({ year: 1901, month: 12, day: 31 });
    expect(coversFullYear(s!.from, s!.to)).toBe(true);
  });

  it("最新元号には終端が無く、確認期限を超えても算出できる", () => {
    const s = segmentOfEraYear(era("令和"), 50);
    expect(s?.from).toEqual({ year: 2068, month: 1, day: 1 });
    expect(s?.to).toEqual({ year: 2068, month: 12, day: 31 });
  });

  it("存在しない元号年は null", () => {
    expect(segmentOfEraYear(era("昭和"), 65)).toBeNull();
    expect(segmentOfEraYear(era("大正"), 16)).toBeNull();
    expect(segmentOfEraYear(era("平成"), 32)).toBeNull();
    expect(segmentOfEraYear(era("明治"), 46)).toBeNull();
  });

  it("0 以下・非整数は null", () => {
    expect(segmentOfEraYear(era("平成"), 0)).toBeNull();
    expect(segmentOfEraYear(era("平成"), -1)).toBeNull();
    expect(segmentOfEraYear(era("平成"), 1.5)).toBeNull();
  });

  it("改元年の両側は往復して一致する", () => {
    // 昭和64年と平成元年は同じ西暦年を分け合う
    const showa = segmentOfEraYear(era("昭和"), 64);
    const heisei = segmentOfEraYear(era("平成"), 1);
    expect(showa?.from.year).toBe(heisei?.from.year);
    expect(showa?.to.day).toBe((heisei?.from.day ?? 0) - 1);
  });
});
