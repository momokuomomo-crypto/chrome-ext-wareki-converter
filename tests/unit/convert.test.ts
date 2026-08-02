import { describe, expect, it } from "vitest";
import { convert } from "../../src/domain/convert.js";
import { verifiedThrough } from "../../src/domain/eras.js";
import { formatForClipboard, formatForNotification, formatForPopup, verificationNote } from "../../src/presentation/format-result.js";

const okv = (s: string) => {
  const r = convert(s);
  if (!r.ok) throw new Error(`unexpected ${r.error.code} for ${s}`);
  return r.value;
};

describe("双方向変換", () => {
  it("西暦→和暦", () => {
    const r = okv("1989/1/8");
    expect(r.wareki).toBe("平成元年1月8日");
    expect(r.gregorian).toEqual({ year: 1989, month: 1, day: 8 });
  });

  it("和暦→西暦", () => {
    const r = okv("平成元年1月8日");
    expect(r.gregorian).toEqual({ year: 1989, month: 1, day: 8 });
    expect(r.wareki).toBe("平成元年1月8日");
  });

  it("往復変換が一致する", () => {
    for (const s of ["1912/7/30", "1926/12/25", "1989/1/8", "2019/5/1", "1987/5/14"]) {
      const a = okv(s);
      const b = okv(a.wareki);
      expect(b.gregorian, s).toEqual(a.gregorian);
    }
  });
});

describe("表示の主従（方向切替）", () => {
  it("toWareki は和暦が主", () => {
    const f = formatForPopup(okv("1989/1/8"), "toWareki");
    expect(f.primary).toBe("平成元年1月8日");
    expect(f.secondary).toBe("1989年1月8日");
  });
  it("toGregorian は西暦が主", () => {
    const f = formatForPopup(okv("平成元年1月8日"), "toGregorian");
    expect(f.primary).toBe("1989年1月8日");
    expect(f.secondary).toBe("平成元年1月8日");
  });
});

describe("確認期限（要件 6-5）", () => {
  const v = verifiedThrough();

  it("期限内は警告なし", () => {
    const r = okv(`${v.year}/12/31`);
    expect(r.beyondVerified).toBe(false);
    expect(verificationNote(r)).toBeNull();
  });

  it("期限を超えても変換は成功し、警告注記が付く", () => {
    const r = okv(`${v.year + 1}/1/1`);
    expect(r.beyondVerified).toBe(true);
    expect(r.wareki).not.toBe("");
    expect(verificationNote(r)).toContain("確認期限");
  });

  it("和暦→西暦方向でも同じ規則が適用される", () => {
    // 令和50年 = 2068年。最新元号には次が無いため isWithinEra では検出できない。
    const r = okv("令和50年1月1日");
    expect(r.gregorian).toEqual({ year: 2068, month: 1, day: 1 });
    expect(r.beyondVerified).toBe(true);
    expect(verificationNote(r)).not.toBeNull();
  });
});

describe("コピーと通知", () => {
  it("コピーは主表示＋副表示の2行のみ。注記を含めない", () => {
    const r = okv("1989/1/8"); // 改元年なので注記がある
    expect(formatForPopup(r, "toWareki").notes.length).toBeGreaterThan(0);
    expect(formatForClipboard(r, "toWareki")).toBe("平成元年1月8日\n1989年1月8日");
  });

  it("通知は主表示のみ。注記を載せない", () => {
    const n = formatForNotification(okv("1989/1/8"), "toWareki");
    expect(n.title).toBe("平成元年1月8日");
    expect(n.message).toBe("1989年1月8日");
    expect(n.message).not.toContain("までが");
  });
});
