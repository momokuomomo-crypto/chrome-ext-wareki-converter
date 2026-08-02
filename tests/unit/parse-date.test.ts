import { describe, expect, it } from "vitest";
import { parseDateInput } from "../../src/domain/parse-date.js";

const d = (y: number, m: number, day: number) => ({ year: y, month: m, day });
const okv = (s: string) => {
  const r = parseDateInput(s);
  if (!r.ok) throw new Error(`expected ok but got ${r.error.code} for ${JSON.stringify(s)}`);
  return r.value;
};
/** 年月日そろった結果であることを確かめたうえで日付を取り出す */
const dateOf = (s: string) => {
  const v = okv(s);
  if (v.kind !== "date") throw new Error(`expected a date but got ${v.kind} for ${JSON.stringify(s)}`);
  return v.date;
};
const code = (s: string) => {
  const r = parseDateInput(s);
  if (r.ok) throw new Error(`expected error but parsed ${JSON.stringify(r.value)} for ${s}`);
  return r.error.code;
};
const errOf = (s: string) => {
  const r = parseDateInput(s);
  if (r.ok) throw new Error("expected error");
  return r.error;
};

describe("受理する形式", () => {
  it.each(["1989/1/8", "1989-1-8", "1989.1.8", "1989年1月8日", "1989/01/08"])(
    "西暦 %s", (s) => expect(dateOf(s)).toEqual(d(1989, 1, 8)));

  it.each(["平成元年1月8日", "平成1年1月8日", "H1.1.8", "H元.1.8", "h1-1-8", "H元/1/8"])(
    "和暦 %s", (s) => expect(dateOf(s)).toEqual(d(1989, 1, 8)));

  it("入力の体系を判別する", () => {
    expect(okv("1989/1/8").inputKind).toBe("gregorian");
    expect(okv("平成元年1月8日").inputKind).toBe("wareki");
    expect(okv("H1.1.8").inputKind).toBe("wareki");
  });

  it("全角", () => {
    expect(dateOf("１９８９年１月８日")).toEqual(d(1989, 1, 8));
    expect(dateOf("平成元年１月８日")).toEqual(d(1989, 1, 8));
  });

  it("先頭ラベル・曜日括弧・末尾語", () => {
    expect(dateOf("生年月日：1989年1月8日")).toEqual(d(1989, 1, 8));
    expect(dateOf("日付: 1989/1/8")).toEqual(d(1989, 1, 8));
    expect(dateOf("1989年1月8日（日）")).toEqual(d(1989, 1, 8));
    expect(dateOf("1989年1月8日生まれ。")).toEqual(d(1989, 1, 8));
  });

  it("空白を含む単一日付を誤って拒否しない（候補数検査の過剰拒否の回帰）", () => {
    expect(dateOf("1989年 1月 8日")).toEqual(d(1989, 1, 8));
    expect(dateOf("1989 / 1 / 8")).toEqual(d(1989, 1, 8));
    expect(dateOf("   1989/1/8   ")).toEqual(d(1989, 1, 8));
  });
});

describe("年のみの入力", () => {
  it("西暦の年は年として受理する（日付へ丸めない）", () => {
    expect(okv("1901")).toEqual({ kind: "gregorianYear", year: 1901, inputKind: "gregorian" });
    expect(okv("1989年")).toEqual({ kind: "gregorianYear", year: 1989, inputKind: "gregorian" });
    expect(okv("１９０１")).toEqual({ kind: "gregorianYear", year: 1901, inputKind: "gregorian" });
  });

  it("和暦の年は元号と元号年として受理する", () => {
    const heisei = okv("平成元年");
    expect(heisei.kind).toBe("eraYear");
    expect(heisei.inputKind).toBe("wareki");
    expect(okv("H1")).toEqual(okv("平成元年"));
    expect(okv("平成1年")).toEqual(okv("平成元年"));
  });

  it("改元年の両側の元号年をどちらも受理する", () => {
    expect(okv("昭和64年").kind).toBe("eraYear"); // 1989/1/1〜1/7
    expect(okv("平成元年").kind).toBe("eraYear"); // 1989/1/8〜12/31
  });

  it("存在しない元号年は期間外として拒否し、正解の年を示す", () => {
    expect(code("昭和65年")).toBe("ERA_OUT_OF_RANGE");
    expect(errOf("昭和65年").suggestion).toBe("この年は 平成2年 です。");
    expect(code("大正16年")).toBe("ERA_OUT_OF_RANGE");
  });

  it("改元年をまたぐ元号年の提案は両方を並べる", () => {
    // 明治46年 = 1913年ではなく、機械換算先の 1913 年は大正2年のみ
    expect(errOf("明治46年").suggestion).toBe("この年は 大正2年 です。");
    // 明治45年（1912年）は大正へ改元した年なので実在する
    expect(okv("明治45年").kind).toBe("eraYear");
  });

  it("旧暦期間にかかる年は拒否する", () => {
    expect(code("明治5年")).toBe("BELOW_MIN_DATE");
    expect(code("1872")).toBe("BELOW_MIN_DATE");
    expect(code("1872年")).toBe("BELOW_MIN_DATE");
    expect(okv("明治6年").kind).toBe("eraYear");
    expect(okv("1873").kind).toBe("gregorianYear");
  });

  it("裸の1〜3桁は年とみなさない（打ち間違いを旧暦の文言で返さない）", () => {
    expect(code("5")).toBe("UNPARSABLE");
    expect(code("199")).toBe("UNPARSABLE");
    // 「年」を伴えば年として扱い、範囲外として断る
    expect(code("199年")).toBe("BELOW_MIN_DATE");
  });

  it("3桁の元号年も形式として受理し、実在しなければ期間外として断る", () => {
    // 2桁までに絞ると「日付を読み取れません」に落ち、昭和65年との応答がちぐはぐになる
    expect(code("昭和100年")).toBe("ERA_OUT_OF_RANGE");
    expect(errOf("昭和100年").suggestion).toBe("この年は 令和7年 です。");
    // 最新元号には終わりが無いため 3 桁でも実在する（確認期限の警告は convert 側で付く）
    expect(okv("令和100年").kind).toBe("eraYear");
    expect(okv("R100").kind).toBe("eraYear");
  });
});

describe("複数日付の検知（2点検査）", () => {
  it.each([
    "生年月日：1987年5月14日 登録日：2020年1月1日",
    "1987年5月14日 1990年1月1日",
    "1987年5月14日1990年1月1日",
    "1989/1/7〜1989/1/8",
    "昭和64年1月7日 平成元年1月8日",
  ])("半角 %s", (s) => expect(code(s)).toBe("MULTIPLE_DATES"));

  it("全角の2日付も検知する（NFKC前の候補数は0件になる）", () => {
    expect(code("生年月日：１９８７年５月１４日 登録日：２０２０年１月１日")).toBe("MULTIPLE_DATES");
    expect(code("１９８９年１月７日 １９８９年１月８日")).toBe("MULTIPLE_DATES");
  });
});

describe("先頭ラベル除去の条件", () => {
  it("元号名を含むラベルは剥がさない（意図的挙動）", () => {
    // `平成元年:1987年5月14日` の誤受理を塞ぐための規則。副作用として
    // `平成生まれ：…` のような自然なラベルも拒否されるが安全側に倒す。
    // ラベルを剥がさない結果、全体が許可形式に一致せず拒否される（目的は達成）
    expect(code("平成元年:1987年5月14日")).toBe("UNPARSABLE");
    expect(code("平成生まれ：1987年5月14日")).toBe("UNPARSABLE");
  });

  it("コロンより前が数字を含む場合は剥がさない", () => {
    expect(code("1989/1/8 10:30")).toBe("UNPARSABLE");
  });

  it("区切り記号が多すぎる場合は専用コード", () => {
    expect(code("メモ:日付:1989/1/8")).toBe("TOO_MANY_SEPARATORS");
  });
});

describe("受理しない形式", () => {
  it.each(["87/1/8", "1/8/1989", "19890108", "千九百八十九年", "1989/1-8", "1989-1.8"])(
    "%s", (s) => expect(code(s)).toBe("UNPARSABLE"));

  it("存在しない日付", () => {
    expect(code("1989年2月30日")).toBe("NONEXISTENT_DATE");
    expect(code("2001/2/29")).toBe("NONEXISTENT_DATE");
    expect(dateOf("2000/2/29")).toEqual(d(2000, 2, 29));
  });

  it("元号期間外", () => {
    expect(code("H1.1.7")).toBe("ERA_OUT_OF_RANGE");
    expect(code("S64.1.8")).toBe("ERA_OUT_OF_RANGE");
    expect(code("令和元年4月30日")).toBe("ERA_OUT_OF_RANGE");
  });

  it("存在しない和暦に「もしかして」提案を付す（要件 6-9）", () => {
    expect(errOf("昭和64年1月8日").suggestion).toBe("この日付は 平成元年1月8日 です。");
    expect(errOf("平成31年5月1日").suggestion).toBe("この日付は 令和元年5月1日 です。");
    // 3桁の元号年でも同じ扱いにする
    expect(errOf("昭和100年1月1日").suggestion).toBe("この日付は 令和7年1月1日 です。");
  });

  it("明治5年以前", () => {
    expect(code("明治元年2月1日")).toBe("BELOW_MIN_DATE");
    expect(code("1872/12/31")).toBe("BELOW_MIN_DATE");
    expect(dateOf("明治6年1月1日")).toEqual(d(1873, 1, 1));
  });

  it("空・長すぎる", () => {
    expect(code("")).toBe("EMPTY_INPUT");
    expect(code("あ".repeat(65))).toBe("TOO_LONG");
  });
});
