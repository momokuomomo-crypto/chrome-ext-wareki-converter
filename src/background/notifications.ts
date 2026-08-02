/**
 * 通知。
 *
 * chrome.notifications.create() はコールバックの成否では抑制を検知できないため、
 * 送信前に getPermissionLevel() を確認する。
 *
 * **限界**：getPermissionLevel() が反映するのは Chrome の拡張ごとの通知設定であって、
 * OS 側の抑制（Windows の集中モード、macOS のおやすみモード）ではない。
 * OS 側で抑制されている場合は "granted" が返り create も成功するため、
 * ユーザーには何も表示されないまま成功したように見える。
 */

import { saveSessionResult, type SessionResult } from "../infrastructure/session-result.js";

const NOTIFICATION_ID = "wareki-converter-result";
const ICON_URL = "icons/icon128.png";

export type NotificationPermissionLevel = "granted" | "denied";

async function getPermissionLevel(): Promise<NotificationPermissionLevel> {
  return new Promise((resolve) => {
    chrome.notifications.getPermissionLevel((level) =>
      resolve(level as NotificationPermissionLevel),
    );
  });
}

export async function clearBadge(): Promise<void> {
  await chrome.action.setBadgeText({ text: "" });
  await chrome.action.setTitle({ title: "" });
}

async function showBadgeFallback(): Promise<void> {
  await chrome.action.setBadgeText({ text: "!" });
  await chrome.action.setBadgeBackgroundColor({ color: "#8B2F4A" });
  await chrome.action.setTitle({
    title: "通知が無効です。ここを開くと変換結果を確認できます",
  });
}

/**
 * 同一の通知IDを再利用して更新する（連打しても積み上がらない）。
 * denied の場合は結果を storage.session に保存し、バッジで誘導する。
 */
export async function showResult(result: SessionResult): Promise<void> {
  const level = await getPermissionLevel();
  if (level === "denied") {
    await saveSessionResult(result);
    await showBadgeFallback();
    return;
  }

  await clearBadge();
  await new Promise<void>((resolve) => {
    chrome.notifications.create(
      NOTIFICATION_ID,
      {
        type: "basic",
        iconUrl: ICON_URL,
        title: result.title,
        message: result.message,
        priority: 0,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.warn("notifications.create:", chrome.runtime.lastError.message);
        }
        resolve();
      },
    );
  });
}
