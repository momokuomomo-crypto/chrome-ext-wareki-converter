/**
 * 通知が拒否されている場合の一時結果（要件 7-2）。
 * storage.session はブラウザセッション中のみ生存し、ディスクに残らない。
 */

const KEY = "lastResult";

export type SessionResult = { title: string; message: string; notes: string[] };

export async function saveSessionResult(r: SessionResult): Promise<void> {
  await chrome.storage.session.set({ [KEY]: r });
}

export async function takeSessionResult(): Promise<SessionResult | null> {
  const raw = (await chrome.storage.session.get(KEY)) as Record<string, unknown>;
  const v = raw[KEY];
  if (!v || typeof v !== "object") return null;
  await chrome.storage.session.remove(KEY);
  const o = v as Partial<SessionResult>;
  if (typeof o.title !== "string" || typeof o.message !== "string") return null;
  return { title: o.title, message: o.message, notes: Array.isArray(o.notes) ? o.notes : [] };
}
