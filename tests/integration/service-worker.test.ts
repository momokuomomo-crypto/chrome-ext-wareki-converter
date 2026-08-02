import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installChromeMock, uninstallChromeMock, type ChromeMock } from "./chrome-mock.js";

let mock: ChromeMock;
const load = async () => { vi.resetModules(); return import("../../src/background/service-worker.js"); };

beforeEach(() => { mock = installChromeMock(); });
afterEach(() => { uninstallChromeMock(); });

describe("コンテキストメニュー", () => {
  it("removeAll → create の順で1件だけ登録する", async () => {
    await load();
    for (const fn of mock.listeners.onInstalled) fn();
    await vi.waitFor(() => expect(mock.contextMenus.created).toHaveLength(1));
    expect(mock.contextMenus.removeAllCalls).toBe(1);
    expect(mock.contextMenus.created[0]?.contexts).toEqual(["selection"]);
  });

  it("onStartup でも再登録する（自己回復）", async () => {
    await load();
    expect(mock.listeners.onStartup.length).toBeGreaterThan(0);
    for (const fn of mock.listeners.onStartup) fn();
    await vi.waitFor(() => expect(mock.contextMenus.created).toHaveLength(1));
  });
});

describe("右クリック経路", () => {
  it("西暦を和暦へ変換して通知する", async () => {
    const { handleClick } = await load();
    await handleClick("1989/1/8");
    expect(mock.notifications.created).toHaveLength(1);
    expect(mock.notifications.created[0]!.options.title).toBe("平成元年1月8日");
    expect(mock.notifications.created[0]!.options.message).toBe("1989年1月8日");
  });

  it("通知に注記を載せない", async () => {
    const { handleClick } = await load();
    await handleClick("1989/1/8");
    expect(mock.notifications.created[0]!.options.message).not.toContain("までが");
  });

  it("保存済みの方向設定に従う", async () => {
    mock.storage.data["settings"] = { schemaVersion: 1, direction: "toGregorian" };
    const { handleClick } = await load();
    await handleClick("平成元年1月8日");
    expect(mock.notifications.created[0]!.options.title).toBe("1989年1月8日");
  });

  it("複数日付を明示エラーにする", async () => {
    const { handleClick } = await load();
    await handleClick("生年月日：1987年5月14日 登録日：2020年1月1日");
    expect(mock.notifications.created[0]!.options.message).toContain("1件だけ");
  });

  it("連打しても通知が積み上がらない", async () => {
    const { handleClick } = await load();
    await handleClick("1989/1/8");
    await handleClick("2019/5/1");
    expect(new Set(mock.notifications.created.map((n) => n.id)).size).toBe(1);
    expect(mock.notifications.created.at(-1)!.options.title).toBe("令和元年5月1日");
  });

  it("Service Worker 再起動後も設定を読み直す", async () => {
    mock.storage.data["settings"] = { schemaVersion: 1, direction: "toGregorian" };
    const a = await load();
    await a.handleClick("平成元年1月8日");
    const b = await load();
    await b.handleClick("平成元年1月8日");
    expect(mock.notifications.created.at(-1)!.options.title).toBe("1989年1月8日");
  });
});

describe("未知 schemaVersion", () => {
  it("エラー通知になり、書き戻さない", async () => {
    mock.storage.data["settings"] = { schemaVersion: 99 };
    const { handleClick } = await load();
    await handleClick("1989/1/8");
    expect(mock.notifications.created[0]!.options.message).toContain("設定を読み取れません");
    expect(mock.setStorageSpy).not.toHaveBeenCalled();
  });
});

describe("通知が拒否されている場合", () => {
  it("結果を storage.session に保存しバッジで誘導する", async () => {
    mock.notifications.permissionLevel = "denied";
    const { handleClick } = await load();
    await handleClick("1989/1/8");
    expect(mock.notifications.created).toHaveLength(0);
    expect(mock.action.badgeText).toBe("!");
    const saved = mock.session.data["lastResult"] as { title: string; notes: string[] };
    expect(saved.title).toBe("平成元年1月8日");
    expect(saved.notes.length).toBeGreaterThan(0); // 一時保存には注記も含める
  });

  it("granted ならバッジをクリアする", async () => {
    const { handleClick } = await load();
    await handleClick("1989/1/8");
    expect(mock.action.badgeText).toBe("");
  });
});

describe("リスナーの例外処理", () => {
  it("未処理 rejection にならない", async () => {
    await load();
    const rejections: unknown[] = [];
    const onRejection = (e: unknown) => rejections.push(e);
    process.on("unhandledRejection", onRejection);
    (globalThis as unknown as { chrome: { storage: { local: unknown } } }).chrome.storage.local = {
      get: async () => { throw new Error("storage down"); }, set: async () => {},
    };
    for (const fn of mock.listeners.onClicked) {
      fn({ menuItemId: "convert-wareki", selectionText: "1989/1/8" } as chrome.contextMenus.OnClickData);
    }
    await vi.waitFor(() => expect(mock.notifications.created.length).toBeGreaterThan(0));
    process.off("unhandledRejection", onRejection);
    expect(rejections).toHaveLength(0);
    expect(mock.notifications.created.at(-1)!.options.message).toContain("エラーが発生しました");
  });
});
