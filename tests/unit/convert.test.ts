import { describe, expect, it } from "vitest";
import { convert } from "../../src/domain/convert.js";
import { verifiedThrough } from "../../src/domain/eras.js";
import { formatForClipboard, formatForNotification, formatForPopup, verificationNote } from "../../src/presentation/format-result.js";

const okv = (s: string) => {
  const r = convert(s);
  if (!r.ok) throw new Error(`unexpected ${r.error.code} for ${s}`);
  return r.value;
};
/** 年月日そろった結果であることを確かめたうえで取り出す */
const dateResult = (s: string) => {
  const r = okv(s);
  if (r.kind !== "date") throw new Error(`expected a date result but got ${r.kind} for ${s}`);
  return r;
};
/** 年だけの結果であることを確かめたうえで取り出す */
const yearResult = (s: string) => {
  const r = okv(s);
  if (r.kind !== "year") throw new Error(`expected a year result but got ${r.kind} for ${s}`);
  return r;
};

describe("双方向変換", () => {
  it("西暦→和暦", () => {
    const r = dateResult("1989/1/8");
    expect(r.wareki).toBe("平成元年1月8日");
    expect(r.gregorian).toEqual({ year: 1989, month: 1, day: 8 });
  });

  it("和暦→西暦", () => {
    const r = dateResult("平成元年1月8日");
    expect(r.gregorian).toEqual({ year: 1989, month: 1, day: 8 });
    expect(r.wareki).toBe("平成元年1月8日");
  });

  it("往復変換が一致する", () => {
    for (const s of ["1912/7/30", "1926/12/25", "1989/1/8", "2019/5/1", "1987/5/14"]) {
      const a = dateResult(s);
      const b = dateResult(a.wareki);
      expect(b.gregorian, s).toEqual(a.gregorian);
    }
  });
});

describe("年のみの変換", () => {
  it("改元の無い年は元号年ひとつを返す", () => {
    const r = yearResult("1901");
    expect(r.gregorianYear).toBe(1901);
    expect(r.segments).toHaveLength(1);
    expect(r.segments[0]?.era.name).toBe("明治");
    expect(r.segments[0]?.eraYearLabel).toBe("34");
    expect(r.from).toEqual({ year: 1901, month: 1, day: 1 });
    expect(r.to).toEqual({ year: 1901, month: 12, day: 31 });
  });

  it("改元年は両方の元号年を境界つきで返す", () => {
    const r = yearResult("1989");
    expect(r.segments).toHaveLength(2);
    expect(r.segments[0]?.era.name).toBe("昭和");
    expect(r.segments[0]?.eraYearLabel).toBe("64");
    expect(r.segments[0]?.to).toEqual({ year: 1989, month: 1, day: 7 });
    expect(r.segments[1]?.era.name).toBe("平成");
    expect(r.segments[1]?.eraYearLabel).toBe("元");
    expect(r.segments[1]?.from).toEqual({ year: 1989, month: 1, day: 8 });
  });

  it("和暦の年は西暦上の期間を返す", () => {
    const heisei = yearResult("平成元年");
    expect(heisei.gregorianYear).toBe(1989);
    expect(heisei.from).toEqual({ year: 1989, month: 1, day: 8 });
    expect(heisei.to).toEqual({ year: 1989, month: 12, day: 31 });

    const showa = yearResult("昭和64年");
    expect(showa.from).toEqual({ year: 1989, month: 1, day: 1 });
    expect(showa.to).toEqual({ year: 1989, month: 1, day: 7 });
  });

  it("改元年には注記が付く", () => {
    expect(formatForPopup(yearResult("1989"), "toWareki").notes.length).toBeGreaterThan(0);
    expect(formatForPopup(yearResult("1901"), "toWareki").notes).toHaveLength(0);
  });

  it("表示：改元の無い年", () => {
    const f = formatForPopup(yearResult("1901"), "toWareki");
    expect(f.primaryLines).toEqual(["明治34年"]);
    expect(f.secondaryLines).toEqual(["1901年"]);
  });

  it("表示：改元年は期間を併記する", () => {
    const f = formatForPopup(yearResult("1989"), "toWareki");
    expect(f.primaryLines).toEqual(["昭和64年（1月1日〜1月7日）", "平成元年（1月8日〜12月31日）"]);
    expect(f.secondaryLines).toEqual(["1989年"]);
  });

  it("表示：和暦の年は西暦側に期間を書く", () => {
    const f = formatForPopup(yearResult("平成元年"), "toWareki");
    expect(f.primaryLines).toEqual(["平成元年"]);
    expect(f.secondaryLines).toEqual(["1989年1月8日〜12月31日"]);
  });

  it("確認期限は年の終端で判定する", () => {
    const v = verifiedThrough();
    expect(yearResult(`${v.year}`).beyondVerified).toBe(false);
    expect(yearResult(`${v.year + 1}`).beyondVerified).toBe(true);
  });
});

describe("表示の主従（方向切替）", () => {
  it("toWareki は和暦が主", () => {
    const f = formatForPopup(dateResult("1989/1/8"), "toWareki");
    expect(f.primaryLines).toEqual(["平成元年1月8日"]);
    expect(f.secondaryLines).toEqual(["1989年1月8日"]);
  });
  it("toGregorian は西暦が主", () => {
    const f = formatForPopup(dateResult("平成元年1月8日"), "toGregorian");
    expect(f.primaryLines).toEqual(["1989年1月8日"]);
    expect(f.secondaryLines).toEqual(["平成元年1月8日"]);
  });
  it("年のみの結果でも主従が入れ替わる", () => {
    const f = formatForPopup(yearResult("1989"), "toGregorian");
    expect(f.primaryLines).toEqual(["1989年"]);
    expect(f.secondaryLines).toHaveLength(2);
  });
});

describe("確認期限（要件 6-5）", () => {
  const v = verifiedThrough();

  it("期限内は警告なし", () => {
    const r = dateResult(`${v.year}/12/31`);
    expect(r.beyondVerified).toBe(false);
    expect(verificationNote(r)).toBeNull();
  });

  it("期限を超えても変換は成功し、警告注記が付く", () => {
    const r = dateResult(`${v.year + 1}/1/1`);
    expect(r.beyondVerified).toBe(true);
    expect(r.wareki).not.toBe("");
    expect(verificationNote(r)).toContain("確認期限");
  });

  it("和暦→西暦方向でも同じ規則が適用される", () => {
    // 令和50年 = 2068年。最新元号には次が無いため isWithinEra では検出できない。
    const r = dateResult("令和50年1月1日");
    expect(r.gregorian).toEqual({ year: 2068, month: 1, day: 1 });
    expect(r.beyondVerified).toBe(true);
    expect(verificationNote(r)).not.toBeNull();
  });
});

describe("コピーと通知", () => {
  it("コピーは主表示＋副表示のみ。注記を含めない", () => {
    const r = dateResult("1989/1/8"); // 改元年なので注記がある
    expect(formatForPopup(r, "toWareki").notes.length).toBeGreaterThan(0);
    expect(formatForClipboard(r, "toWareki")).toBe("平成元年1月8日\n1989年1月8日");
  });

  it("年のみの結果は全行をコピーする", () => {
    expect(formatForClipboard(yearResult("1989"), "toWareki")).toBe(
      "昭和64年（1月1日〜1月7日）\n平成元年（1月8日〜12月31日）\n1989年",
    );
  });

  it("通知は主表示のみ。注記を載せない", () => {
    const n = formatForNotification(dateResult("1989/1/8"), "toWareki");
    expect(n.title).toBe("平成元年1月8日");
    expect(n.message).toBe("1989年1月8日");
    expect(n.message).not.toContain("までが");
  });

  it("通知は複数行を1行へ畳む", () => {
    const n = formatForNotification(yearResult("1989"), "toWareki");
    expect(n.title).toBe("昭和64年（1月1日〜1月7日）／平成元年（1月8日〜12月31日）");
    expect(n.title).not.toContain("\n");
  });
});
