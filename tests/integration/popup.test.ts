/**
 * ポップアップの結合テスト。
 * 「一度変換したあと動かなくなる」報告の再現を目的に、同一ポップアップ内での
 * 連続変換と、閉じて開き直したあとの操作可否を検証する。
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { installChromeMock, uninstallChromeMock, type ChromeMock } from "./chrome-mock.js";

const HTML = readFileSync(resolve(__dirname, "../../src/popup/popup.html"), "utf8");

let mock: ChromeMock;

/** popup.html の body を DOM に流し込み、initPopup を新規に読み込む */
async function openPopup(): Promise<typeof import("../../src/popup/popup.js")> {
  const inner = /<body>([\s\S]*)<\/body>/.exec(HTML)?.[1];
  if (inner === undefined) throw new Error("popup.html に body が見つからない");
  const body = inner.replace(/<script[\s\S]*?<\/script>/g, "");
  document.body.innerHTML = body;
  const mod = await import("../../src/popup/popup.js");
  mod.initPopup();
  await flush();
  return mod;
}

/** 保留中のマイクロタスクを排出する */
async function flush(): Promise<void> {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing: ${id}`);
  return el as T;
}

async function submitWith(value: string): Promise<void> {
  $<HTMLInputElement>("input").value = value;
  $<HTMLFormElement>("form").dispatchEvent(
    new Event("submit", { bubbles: true, cancelable: true }),
  );
  await flush();
}

beforeEach(() => {
  mock = installChromeMock();
  (globalThis as unknown as { navigator: unknown }).navigator ??= {};
});

afterEach(() => {
  uninstallChromeMock();
  document.body.innerHTML = "";
});

describe("ポップアップ", () => {
  it("読み込み完了後にフォームが操作可能になる", async () => {
    await openPopup();
    expect($<HTMLInputElement>("input").disabled).toBe(false);
    expect($<HTMLButtonElement>("convert").disabled).toBe(false);
  });

  it("同じポップアップ内で連続して変換できる", async () => {
    await openPopup();

    await submitWith("1989/1/8");
    expect($("result").hidden).toBe(false);
    expect($("primary").textContent).toBe("平成元年1月8日");

    await submitWith("2020/1/1");
    expect($("result").hidden).toBe(false);
    expect($("primary").textContent).toBe("令和2年1月1日");
  });

  it("年だけの入力を変換して表示する（1901 は明治34年）", async () => {
    await openPopup();

    await submitWith("1901");
    expect($("error").hidden).toBe(true);
    expect($("result").hidden).toBe(false);
    expect($("primary").textContent).toBe("明治34年");
    expect($("secondary").textContent).toBe("1901年");
    expect($("notes").hidden).toBe(true);
  });

  it("改元年は両方の元号年を別々の行に出し、境界を注記する", async () => {
    await openPopup();

    await submitWith("1989");
    const lines = Array.from($("primary").children, (c) => c.textContent);
    expect(lines).toEqual(["昭和64年（1月1日〜1月7日）", "平成元年（1月8日〜12月31日）"]);
    expect($("secondary").textContent).toBe("1989年");
    expect($("notes").hidden).toBe(false);
    expect($("notes").textContent).toContain("1月8日からが平成元年");
  });

  it("年のみの結果でも方向切替が効く", async () => {
    await openPopup();
    await submitWith("1989");

    $<HTMLInputElement>("dir-gregorian").checked = true;
    $<HTMLInputElement>("dir-gregorian").dispatchEvent(new Event("change", { bubbles: true }));
    await flush();

    expect($("primary").textContent).toBe("1989年");
    expect(Array.from($("secondary").children)).toHaveLength(2);
  });

  it("エラーのあと、正しい入力に直せば結果が表示される", async () => {
    await openPopup();

    await submitWith("ほげ");
    expect($("error").hidden).toBe(false);
    expect($("result").hidden).toBe(true);

    await submitWith("1989/1/8");
    expect($("error").hidden).toBe(true);
    expect($("result").hidden).toBe(false);
    expect($("primary").textContent).toBe("平成元年1月8日");
  });

  it("結果を出したあとエラーにすると、結果が消えてエラーが出る", async () => {
    await openPopup();

    await submitWith("1989/1/8");
    expect($("result").hidden).toBe(false);

    await submitWith("ほげ");
    expect($("result").hidden).toBe(true);
    expect($("error").hidden).toBe(false);
    expect($("error").textContent).not.toBe("");
  });

  it("エラーが連続しても毎回表示される", async () => {
    await openPopup();

    await submitWith("ほげ");
    const first = $("error").textContent;
    expect($("error").hidden).toBe(false);

    await submitWith("1872/1/1");
    expect($("error").hidden).toBe(false);
    expect($("error").textContent).not.toBe(first);
  });

  it("クリップボードが同期例外を投げてもコピーボタンが再度押せる", async () => {
    (globalThis.navigator as unknown as { clipboard: unknown }).clipboard = {
      writeText: () => {
        throw new TypeError("clipboard unavailable");
      },
    };

    await openPopup();
    await submitWith("1989/1/8");

    $<HTMLButtonElement>("copy").click();
    await flush();

    expect($<HTMLButtonElement>("copy").disabled).toBe(false);
    expect($("copy-status").hidden).toBe(false);
  });

  it("一度変換して設定が保存されたあと、開き直しても操作できる", async () => {
    await openPopup();
    await submitWith("1989/1/8");
    expect(mock.storage.data.settings).toBeDefined();

    // 2回目の起動。前回保存した設定を読んだ状態から始まる
    await openPopup();
    expect($<HTMLInputElement>("input").disabled).toBe(false);
    expect($<HTMLButtonElement>("convert").disabled).toBe(false);

    await submitWith("2020/1/1");
    expect($("primary").textContent).toBe("令和2年1月1日");
  });
});
