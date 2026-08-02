/**
 * ポップアップ。表示はすべて textContent。innerHTML は使わない。
 *
 * 設定の読み込みが完了するまでフォームを無効化する。読み込み前に操作できると、
 * 未知 schemaVersion のデータを既定値で上書きする TOCTOU が成立する。
 */

import { convert, type ConversionResult, type Direction } from "../domain/convert.js";
import { messageFor } from "../domain/errors.js";
import { clearBadge } from "../background/notifications.js";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  resetSettings,
  saveSettings,
  type Settings,
} from "../infrastructure/settings.js";
import { takeSessionResult } from "../infrastructure/session-result.js";
import { formatForClipboard, formatForPopup } from "../presentation/format-result.js";

function must<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element not found: ${id}`);
  return el as T;
}

export function initPopup(): void {
  const el = {
    form: must<HTMLFormElement>("form"),
    input: must<HTMLInputElement>("input"),
    dirWareki: must<HTMLInputElement>("dir-wareki"),
    dirGregorian: must<HTMLInputElement>("dir-gregorian"),
    convert: must<HTMLButtonElement>("convert"),
    error: must<HTMLElement>("error"),
    result: must<HTMLElement>("result"),
    primary: must<HTMLElement>("primary"),
    secondary: must<HTMLElement>("secondary"),
    notes: must<HTMLElement>("notes"),
    copy: must<HTMLButtonElement>("copy"),
    copyStatus: must<HTMLElement>("copy-status"),
    warning: must<HTMLElement>("settings-warning"),
    warningText: must<HTMLElement>("settings-warning-text"),
    reset: must<HTMLButtonElement>("reset-settings"),
    pending: must<HTMLElement>("pending"),
    pendingText: must<HTMLElement>("pending-text"),
  };

  let settings: Settings = { ...DEFAULT_SETTINGS };
  let settingsReadable = false;
  let settingsLoaded = false;
  let lastResult: ConversionResult | null = null;

  function setFormEnabled(enabled: boolean): void {
    el.input.disabled = !enabled;
    el.convert.disabled = !enabled;
    el.dirWareki.disabled = !enabled;
    el.dirGregorian.disabled = !enabled;
  }

  function currentDirection(): Direction {
    return el.dirGregorian.checked ? "toGregorian" : "toWareki";
  }

  /** 1 行ごとに要素を作る。改行文字は textContent では折り返されないため。 */
  function setLines(target: HTMLElement, lines: string[]): void {
    target.replaceChildren();
    for (const line of lines) {
      const div = document.createElement("div");
      div.textContent = line;
      target.append(div);
    }
  }

  function clearResult(): void {
    lastResult = null;
    el.result.hidden = true;
    el.primary.replaceChildren();
    el.secondary.replaceChildren();
    el.notes.replaceChildren();
    el.notes.hidden = true;
    el.copyStatus.hidden = true;
  }

  function showError(message: string): void {
    clearResult(); // エラー時に前回の結果を残さない
    el.error.textContent = message;
    el.error.hidden = false;
  }

  function render(result: ConversionResult): void {
    const { primaryLines, secondaryLines, notes } = formatForPopup(result, currentDirection());
    setLines(el.primary, primaryLines);
    setLines(el.secondary, secondaryLines);
    el.notes.replaceChildren();
    for (const note of notes) {
      const li = document.createElement("li");
      li.textContent = note;
      el.notes.append(li);
    }
    el.notes.hidden = notes.length === 0;
    el.result.hidden = false;
    lastResult = result;
  }

  function persistSettings(): void {
    if (!settingsLoaded || !settingsReadable) return;
    const next: Settings = { schemaVersion: 1, direction: currentDirection() };
    settings = next;
    void saveSettings(next).catch((e: unknown) => console.error("saveSettings failed:", e));
  }

  function runConversion(): void {
    if (!settingsLoaded) return;
    el.convert.disabled = true;
    try {
      el.error.hidden = true;
      el.copyStatus.hidden = true;
      const result = convert(el.input.value);
      if (!result.ok) {
        showError(messageFor(result.error));
        return;
      }
      render(result.value);
      persistSettings();
    } finally {
      el.convert.disabled = false;
    }
  }

  el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    runConversion();
  });

  for (const input of [el.dirWareki, el.dirGregorian]) {
    input.addEventListener("change", () => {
      persistSettings();
      // 方向を変えたら表示中の結果も入れ替える
      if (lastResult) render(lastResult);
    });
  }

  /** clipboardWrite 権限を先回りで足さない。手動コピーへ誘導する。 */
  function fallbackToManualCopy(): void {
    el.copyStatus.textContent = "自動コピーできませんでした。結果を選択してコピーしてください。";
    el.copyStatus.hidden = false;
    const range = document.createRange();
    range.selectNodeContents(el.result);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  el.copy.addEventListener("click", () => {
    el.copy.disabled = true;
    const result = lastResult;
    if (!result) {
      el.copy.disabled = false;
      return;
    }

    // navigator.clipboard が無い環境では writeText の呼び出し自体が同期例外になる。
    // 同期例外は連鎖の外へ抜けるため .finally() が走らず、ボタンが disabled のまま
    // 二度と押せなくなる。呼び出しを Promise 連鎖の内側に入れて必ず終端させる。
    void Promise.resolve()
      .then(() => navigator.clipboard.writeText(formatForClipboard(result, currentDirection())))
      .then(() => {
        el.copyStatus.textContent = "コピーしました。";
        el.copyStatus.hidden = false;
      })
      .catch(fallbackToManualCopy)
      .finally(() => {
        el.copy.disabled = false;
      });
  });

  el.reset.addEventListener("click", () => {
    el.reset.disabled = true;
    void resetSettings()
      .then((next) => {
        settings = next;
        settingsReadable = true;
        settingsLoaded = true;
        el.warning.hidden = true;
        el.dirWareki.checked = true;
        setFormEnabled(true);
      })
      .catch((e: unknown) => console.error("resetSettings failed:", e))
      .finally(() => {
        el.reset.disabled = false;
      });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") window.close();
  });

  void loadSettings()
    .then((load) => {
      if (load.status === "unreadable") {
        settingsReadable = false;
        el.warningText.textContent = messageFor({ code: "SETTINGS_UNREADABLE" });
        el.warning.hidden = false;
        return;
      }
      settingsReadable = true;
      settings = load.settings;
      if (settings.direction === "toGregorian") el.dirGregorian.checked = true;
      else el.dirWareki.checked = true;
    })
    .catch((e: unknown) => {
      // 読み込み失敗も「読み取り不能」として扱い、既定値で書き戻さない
      console.error("loadSettings failed:", e);
      settingsReadable = false;
      el.warningText.textContent = messageFor({ code: "SETTINGS_UNREADABLE" });
      el.warning.hidden = false;
    })
    .finally(() => {
      settingsLoaded = true;
      setFormEnabled(true);
      el.input.focus();
    });

  // 通知が拒否されていた場合に残した一時結果を回収して表示し、バッジを消す
  void takeSessionResult()
    .then((pending) => {
      if (!pending) return;
      const lines = [pending.title, pending.message, ...pending.notes];
      el.pendingText.textContent = `通知が表示できなかった直前の結果：${lines.join(" / ")}`;
      el.pending.hidden = false;
    })
    .catch((e: unknown) => console.error("takeSessionResult failed:", e));

  void clearBadge().catch(() => {
    /* action API が使えない環境では無視してよい */
  });

  setFormEnabled(false);
}

if (typeof document !== "undefined" && document.getElementById("form")) {
  initPopup();
}
