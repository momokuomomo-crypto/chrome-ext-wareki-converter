/** 型付き Chrome API モック。境界の振る舞いを検証するために最小限だけ実装する。 */

import { vi } from "vitest";
import type { NotificationPermissionLevel } from "../../src/background/notifications.js";

export type CreatedNotification = {
  id: string;
  options: chrome.notifications.NotificationOptions<true>;
};

export type ChromeMock = {
  storage: { data: Record<string, unknown> };
  session: { data: Record<string, unknown> };
  notifications: {
    created: CreatedNotification[];
    permissionLevel: NotificationPermissionLevel;
    createShouldFail: boolean;
    /** clear と create の呼び出し順を検証するための記録 */
    calls: Array<{ kind: "clear" | "create"; id: string }>;
    /** いま表示されている通知。created（累積の記録）とは別に持つ */
    live: Set<string>;
  };
  contextMenus: { created: chrome.contextMenus.CreateProperties[]; removeAllCalls: number };
  action: { badgeText: string; title: string };
  listeners: {
    onStartup: Array<() => void>;
    onInstalled: Array<() => void>;
    onClicked: Array<(info: chrome.contextMenus.OnClickData) => void>;
  };
  setStorageSpy: ReturnType<typeof vi.fn>;
};

export function installChromeMock(): ChromeMock {
  const state: ChromeMock = {
    storage: { data: {} },
    session: { data: {} },
    notifications: {
      created: [],
      permissionLevel: "granted",
      createShouldFail: false,
      calls: [],
      live: new Set(),
    },
    contextMenus: { created: [], removeAllCalls: 0 },
    action: { badgeText: "", title: "" },
    listeners: { onInstalled: [], onStartup: [], onClicked: [] },
    setStorageSpy: vi.fn(),
  };

  const lastError: { message?: string } | undefined = undefined;

  const chromeMock = {
    runtime: {
      get lastError() {
        return state.notifications.createShouldFail
          ? { message: "mock failure" }
          : lastError;
      },
      onInstalled: {
        addListener: (fn: () => void) => state.listeners.onInstalled.push(fn),
      },
      onStartup: {
        addListener: (fn: () => void) => state.listeners.onStartup.push(fn),
      },
    },
    storage: {
      session: {
        get: async (key: string) => {
          const value = state.session.data[key];
          return value === undefined ? {} : { [key]: value };
        },
        set: async (items: Record<string, unknown>) => {
          Object.assign(state.session.data, items);
        },
        remove: async (key: string) => {
          delete state.session.data[key];
        },
      },
      local: {
        get: async (key: string) => {
          const value = state.storage.data[key];
          return value === undefined ? {} : { [key]: value };
        },
        set: async (items: Record<string, unknown>) => {
          state.setStorageSpy(items);
          Object.assign(state.storage.data, items);
        },
      },
    },
    contextMenus: {
      removeAll: (cb?: () => void) => {
        state.contextMenus.removeAllCalls += 1;
        state.contextMenus.created = [];
        // 実機のコールバックは非同期。同期にすると順序問題を表現できない。
        queueMicrotask(() => cb?.());
      },
      create: (props: chrome.contextMenus.CreateProperties, cb?: () => void) => {
        state.contextMenus.created.push(props);
        queueMicrotask(() => cb?.());
        return props.id ?? "";
      },
      onClicked: {
        addListener: (fn: (info: chrome.contextMenus.OnClickData) => void) =>
          state.listeners.onClicked.push(fn),
      },
    },
    notifications: {
      getPermissionLevel: (cb: (level: NotificationPermissionLevel) => void) => {
        cb(state.notifications.permissionLevel);
      },
      // created は累積の記録なので clear では削らない。表示中かどうかは live で持つ。
      clear: (id: string, cb?: (wasCleared: boolean) => void) => {
        state.notifications.calls.push({ kind: "clear", id });
        const wasLive = state.notifications.live.delete(id);
        // 実機のコールバックは非同期
        queueMicrotask(() => cb?.(wasLive));
      },
      create: (
        id: string,
        options: chrome.notifications.NotificationOptions<true>,
        cb?: (id: string) => void,
      ) => {
        // 実機と同様に、抑制されていても create 自体は成功する
        state.notifications.calls.push({ kind: "create", id });
        state.notifications.created.push({ id, options });
        state.notifications.live.add(id);
        cb?.(id);
      },
    },
    action: {
      setBadgeText: async (d: { text: string }) => {
        state.action.badgeText = d.text;
      },
      setBadgeBackgroundColor: async () => {},
      setTitle: async (d: { title: string }) => {
        state.action.title = d.title;
      },
    },
  };

  (globalThis as unknown as { chrome: unknown }).chrome = chromeMock;
  return state;
}

export function uninstallChromeMock(): void {
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
}
