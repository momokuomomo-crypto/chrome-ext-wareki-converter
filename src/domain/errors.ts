/**
 * エラーコードと文言辞書。ポップアップと通知は同じ辞書を参照する。
 *
 * 姉妹拡張（年齢計算）からの**意図した差分**：
 * - 落とした：REFERENCE_BEFORE_BIRTH / ABOVE_MAX_REFERENCE / SETTINGS_UNREADABLE 以外の年齢固有語
 * - 追加した：YEAR_ONLY（年のみ入力）、TOO_MANY_SEPARATORS（区切り過多）
 */

export type ErrorCode =
  | "EMPTY_INPUT"
  | "TOO_LONG"
  | "UNPARSABLE"
  | "YEAR_ONLY"
  | "NONEXISTENT_DATE"
  | "MULTIPLE_DATES"
  | "TOO_MANY_SEPARATORS"
  | "ERA_OUT_OF_RANGE"
  | "BELOW_MIN_DATE"
  | "SETTINGS_UNREADABLE";

export type AppError = Readonly<{
  code: ErrorCode;
  detail?: string;
  /** 「もしかして」提案（要件 6-9）。存在しない和暦に対して正解を示す */
  suggestion?: string;
}>;

export function messageFor(error: AppError): string {
  const base = ((): string => {
    switch (error.code) {
      case "EMPTY_INPUT":
        return "日付を入力してください。";
      case "TOO_LONG":
        return "日付部分だけを入力または選択してください。";
      case "UNPARSABLE":
        return "日付を読み取れません。例：1989/1/8、平成元年1月8日、H1.1.8";
      case "YEAR_ONLY":
        return "改元年は元号を一意に決められないため、月日まで入力してください。";
      case "NONEXISTENT_DATE":
        return error.detail ? `${error.detail}は存在しません。` : "存在しない日付です。";
      case "MULTIPLE_DATES":
        return "日付は1件だけ指定してください。";
      case "TOO_MANY_SEPARATORS":
        return "日付以外の文字が多く含まれています。日付部分だけを指定してください。";
      case "ERA_OUT_OF_RANGE":
        return error.detail ?? "指定された元号の期間外です。";
      case "BELOW_MIN_DATE":
        return "明治5年以前は旧暦のため対応していません。1873年1月1日以降を入力してください。";
      case "SETTINGS_UNREADABLE":
        return "このバージョンでは設定を読み取れません。拡張機能を更新するか、設定を初期化してください。";
    }
  })();
  return error.suggestion ? `${base}\n${error.suggestion}` : base;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T>(code: ErrorCode, detail?: string, suggestion?: string): Result<T> {
  const e: { code: ErrorCode; detail?: string; suggestion?: string } = { code };
  if (detail !== undefined) e.detail = detail;
  if (suggestion !== undefined) e.suggestion = suggestion;
  return { ok: false, error: e };
}
