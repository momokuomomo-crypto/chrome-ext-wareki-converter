/**
 * Service Worker エントリ。
 * MV3 の Service Worker はいつでも終了・再起動する。メモリに状態を保持しない。
 */

import { convert } from "../domain/convert.js";
import { messageFor } from "../domain/errors.js";
import { loadSettings } from "../infrastructure/settings.js";
import { formatForNotification, formatForPopup } from "../presentation/format-result.js";
import { MENU_ID, registerContextMenu } from "./context-menu.js";
import { showResult } from "./notifications.js";

const ERROR_TITLE = "変換できませんでした";

/** 遅れて完了した古いクリックが最新の結果を上書きしないようにする世代トークン */
let clickGeneration = 0;

function registerMenuSafely(): void {
  registerContextMenu().catch((e: unknown) => {
    console.error("registerContextMenu failed:", e);
  });
}

chrome.runtime.onInstalled.addListener(registerMenuSafely);
// 登録が失われた場合の自己回復経路。onInstalled だけだと二度と復帰できない。
chrome.runtime.onStartup.addListener(registerMenuSafely);

async function handleClick(selectionText: string): Promise<void> {
  const generation = ++clickGeneration;
  const isStale = (): boolean => generation !== clickGeneration;

  const load = await loadSettings();
  if (isStale()) return;

  if (load.status === "unreadable") {
    await showResult({
      title: ERROR_TITLE,
      message: messageFor({ code: "SETTINGS_UNREADABLE" }),
      notes: [],
    });
    return;
  }

  const result = convert(selectionText);
  if (!result.ok) {
    await showResult({ title: ERROR_TITLE, message: messageFor(result.error), notes: [] });
    return;
  }

  if (isStale()) return;

  const direction = load.settings.direction;
  const { title, message } = formatForNotification(result.value, direction);
  // 通知には注記を載せないが、通知が使えない場合の一時保存には含める
  const { notes } = formatForPopup(result.value, direction);
  await showResult({ title, message, notes });
}

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID) return;
  const selection = info.selectionText ?? "";

  // fire-and-forget を作らない。必ず .catch() で終端する（既知不具合パターン3）。
  handleClick(selection).catch((e: unknown) => {
    console.error("handleClick failed:", e);
    void showResult({
      title: ERROR_TITLE,
      message: "変換中にエラーが発生しました。ポップアップから再試行してください。",
      notes: [],
    }).catch((inner: unknown) => {
      console.error("fallback notification failed:", inner);
    });
  });
});

export { handleClick };
