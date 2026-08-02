import { describe, expect, it } from "vitest";
import {
  compare, daysInMonth, fromISO, isLeapYear, isValidDate, makePlainDate,
  nextDay, previousDay, toISO,
} from "../../src/domain/plain-date.js";

const d = (y: number, m: number, day: number) => ({ year: y, month: m, day });

describe("plain-date", () => {
  it("うるう年判定", () => {
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2004)).toBe(true);
    expect(isLeapYear(2001)).toBe(false);
  });

  it("月の日数", () => {
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2001, 2)).toBe(28);
    expect(daysInMonth(2001, 4)).toBe(30);
    expect(daysInMonth(2001, 12)).toBe(31);
  });

  it("実在しない日付を拒否する", () => {
    expect(isValidDate(1987, 2, 30)).toBe(false);
    expect(isValidDate(2001, 2, 29)).toBe(false);
    expect(isValidDate(2000, 2, 29)).toBe(true);
    expect(isValidDate(2000, 13, 1)).toBe(false);
    expect(isValidDate(2000, 0, 1)).toBe(false);
    expect(isValidDate(2000, 1, 0)).toBe(false);
    expect(isValidDate(2000.5, 1, 1)).toBe(false);
    expect(makePlainDate(1987, 2, 30)).toBeNull();
  });

  it("前日", () => {
    expect(previousDay(d(2000, 3, 1))).toEqual(d(2000, 2, 29));
    expect(previousDay(d(2001, 3, 1))).toEqual(d(2001, 2, 28));
    expect(previousDay(d(2000, 1, 1))).toEqual(d(1999, 12, 31));
    expect(previousDay(d(2000, 5, 10))).toEqual(d(2000, 5, 9));
  });

  it("翌日", () => {
    expect(nextDay(d(2000, 2, 29))).toEqual(d(2000, 3, 1));
    expect(nextDay(d(2001, 2, 28))).toEqual(d(2001, 3, 1));
    expect(nextDay(d(1999, 12, 31))).toEqual(d(2000, 1, 1));
    expect(nextDay(d(2000, 4, 30))).toEqual(d(2000, 5, 1));
  });

  it("比較", () => {
    expect(compare(d(2000, 1, 1), d(2000, 1, 2))).toBeLessThan(0);
    expect(compare(d(2000, 2, 1), d(2000, 1, 1))).toBeGreaterThan(0);
    expect(compare(d(2000, 1, 1), d(2000, 1, 1))).toBe(0);
  });

  it("ISO 変換", () => {
    expect(toISO(d(1987, 5, 14))).toBe("1987-05-14");
    expect(fromISO("1987-05-14")).toEqual(d(1987, 5, 14));
    expect(fromISO("1987-5-14")).toBeNull();
    expect(fromISO("1987/05/14")).toBeNull();
    expect(fromISO("1987-02-30")).toBeNull();
  });
});
