/**
 * 設定の保存。永続化するのは変換方向の既定値だけ。
 * 入力・結果・履歴は保存しない（要件 8-2）。
 * 未知の schemaVersion は空状態へ変換せず、書き戻さない（既知不具合パターン2）。
 */

import type { Direction } from "../domain/convert.js";

export const CURRENT_SCHEMA_VERSION = 1;
const STORAGE_KEY = "settings";

export type Settings = { schemaVersion: 1; direction: Direction };

export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  direction: "toWareki",
};

export type SettingsLoad =
  | { status: "ok"; settings: Settings }
  | { status: "unreadable"; foundVersion: unknown };

export async function loadSettings(): Promise<SettingsLoad> {
  const raw = (await chrome.storage.local.get(STORAGE_KEY)) as Record<string, unknown>;
  const stored = raw[STORAGE_KEY];
  if (stored === undefined || stored === null) {
    return { status: "ok", settings: { ...DEFAULT_SETTINGS } };
  }
  if (typeof stored !== "object") return { status: "unreadable", foundVersion: stored };

  const version = (stored as { schemaVersion?: unknown }).schemaVersion;
  if (version !== CURRENT_SCHEMA_VERSION) return { status: "unreadable", foundVersion: version };

  const d = (stored as { direction?: unknown }).direction;
  const direction: Direction = d === "toGregorian" ? "toGregorian" : "toWareki";
  return { status: "ok", settings: { schemaVersion: CURRENT_SCHEMA_VERSION, direction } };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}

export async function resetSettings(): Promise<Settings> {
  const next = { ...DEFAULT_SETTINGS };
  await saveSettings(next);
  return next;
}
