/**
 * コンテキストメニューの登録。
 * 同一IDで create を再実行すると lastError が立つため removeAll() → create() の順を守る。
 * 「登録済み」であることを Service Worker のメモリに保持しない。
 */

export const MENU_ID = "convert-wareki";
export const MENU_TITLE = "選択した日付を和暦・西暦変換";

export function registerContextMenu(): Promise<void> {
  return new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({ id: MENU_ID, title: MENU_TITLE, contexts: ["selection"] }, () => {
        if (chrome.runtime.lastError) {
          console.warn("contextMenus.create:", chrome.runtime.lastError.message);
        }
        resolve();
      });
    });
  });
}
