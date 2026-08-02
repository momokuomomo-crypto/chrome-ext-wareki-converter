// src/domain/eras.ts
var ERAS = [
  { id: "meiji", name: "\u660E\u6CBB", abbreviation: "M", start: { year: 1868, month: 1, day: 25 } },
  { id: "taisho", name: "\u5927\u6B63", abbreviation: "T", start: { year: 1912, month: 7, day: 30 } },
  { id: "showa", name: "\u662D\u548C", abbreviation: "S", start: { year: 1926, month: 12, day: 25 } },
  { id: "heisei", name: "\u5E73\u6210", abbreviation: "H", start: { year: 1989, month: 1, day: 8 } },
  { id: "reiwa", name: "\u4EE4\u548C", abbreviation: "R", start: { year: 2019, month: 5, day: 1 } }
];
var VERIFIED_YEARS_AFTER_LATEST_ERA = 30;
function latestEra() {
  const last = ERAS[ERAS.length - 1];
  if (!last) throw new Error("ERAS is empty");
  return last;
}
function verifiedThrough() {
  return { year: latestEra().start.year + VERIFIED_YEARS_AFTER_LATEST_ERA, month: 12, day: 31 };
}

// src/domain/plain-date.ts
var MIN_SUPPORTED_DATE = { year: 1873, month: 1, day: 1 };
function isLeapYear(year) {
  return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
}
var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function daysInMonth(year, month) {
  if (month < 1 || month > 12) return 0;
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return DAYS_IN_MONTH[month - 1] ?? 0;
}
function isValidDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  return day <= daysInMonth(year, month);
}
function makePlainDate(year, month, day) {
  if (!isValidDate(year, month, day)) return null;
  return { year, month, day };
}
function compare(a, b) {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}
function isSameOrBefore(a, b) {
  return compare(a, b) <= 0;
}
function previousDay(d) {
  if (d.day > 1) return { year: d.year, month: d.month, day: d.day - 1 };
  if (d.month > 1) {
    const month = d.month - 1;
    return { year: d.year, month, day: daysInMonth(d.year, month) };
  }
  return { year: d.year - 1, month: 12, day: 31 };
}
function nextDay(d) {
  if (d.day < daysInMonth(d.year, d.month)) {
    return { year: d.year, month: d.month, day: d.day + 1 };
  }
  if (d.month < 12) return { year: d.year, month: d.month + 1, day: 1 };
  return { year: d.year + 1, month: 1, day: 1 };
}

// src/domain/era.ts
function eraForDate(date) {
  let found = null;
  for (const era of ERAS) {
    if (isSameOrBefore(era.start, date)) found = era;
    else break;
  }
  return found;
}
function findEraByName(name) {
  return ERAS.find((e) => e.name === name);
}
function findEraByAbbreviation(abbr) {
  const upper = abbr.toUpperCase();
  return ERAS.find((e) => e.abbreviation === upper);
}
function nextEra(era) {
  const i = ERAS.findIndex((e) => e.id === era.id);
  return i >= 0 ? ERAS[i + 1] : void 0;
}
function isWithinEra(era, date) {
  if (compare(date, era.start) < 0) return false;
  const next = nextEra(era);
  if (!next) return true;
  return compare(date, next.start) < 0;
}
function eraYearOf(era, date) {
  return date.year - era.start.year + 1;
}
function eraYearLabel(eraYear) {
  return eraYear === 1 ? "\u5143" : String(eraYear);
}
function gregorianYearOf(era, eraYear) {
  return era.start.year + eraYear - 1;
}
function formatWareki(date) {
  const era = eraForDate(date);
  if (!era) return null;
  return `${era.name}${eraYearLabel(eraYearOf(era, date))}\u5E74${date.month}\u6708${date.day}\u65E5`;
}

// src/domain/era-transition.ts
function transitionsInYear(year) {
  const result = [];
  for (const era of ERAS) {
    if (era.start.year !== year) continue;
    const lastDay = previousDay(era.start);
    if (lastDay.year !== year) continue;
    const prev = eraForDate(lastDay);
    if (!prev) continue;
    result.push({
      year,
      previousEra: prev,
      previousEraLastDay: lastDay,
      previousEraYearLabel: eraYearLabel(eraYearOf(prev, lastDay)),
      nextEra: era
    });
  }
  return result;
}

// src/domain/errors.ts
function messageFor(error) {
  const base = (() => {
    switch (error.code) {
      case "EMPTY_INPUT":
        return "\u65E5\u4ED8\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
      case "TOO_LONG":
        return "\u65E5\u4ED8\u90E8\u5206\u3060\u3051\u3092\u5165\u529B\u307E\u305F\u306F\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
      case "UNPARSABLE":
        return "\u65E5\u4ED8\u3092\u8AAD\u307F\u53D6\u308C\u307E\u305B\u3093\u3002\u4F8B\uFF1A1989/1/8\u3001\u5E73\u6210\u5143\u5E741\u67088\u65E5\u3001H1.1.8";
      case "NONEXISTENT_DATE":
        return error.detail ? `${error.detail}\u306F\u5B58\u5728\u3057\u307E\u305B\u3093\u3002` : "\u5B58\u5728\u3057\u306A\u3044\u65E5\u4ED8\u3067\u3059\u3002";
      case "MULTIPLE_DATES":
        return "\u65E5\u4ED8\u306F1\u4EF6\u3060\u3051\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
      case "TOO_MANY_SEPARATORS":
        return "\u65E5\u4ED8\u4EE5\u5916\u306E\u6587\u5B57\u304C\u591A\u304F\u542B\u307E\u308C\u3066\u3044\u307E\u3059\u3002\u65E5\u4ED8\u90E8\u5206\u3060\u3051\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
      case "ERA_OUT_OF_RANGE":
        return error.detail ?? "\u6307\u5B9A\u3055\u308C\u305F\u5143\u53F7\u306E\u671F\u9593\u5916\u3067\u3059\u3002";
      case "BELOW_MIN_DATE":
        return "\u660E\u6CBB5\u5E74\u4EE5\u524D\u306F\u65E7\u66A6\u306E\u305F\u3081\u5BFE\u5FDC\u3057\u3066\u3044\u307E\u305B\u3093\u30021873\u5E741\u67081\u65E5\u4EE5\u964D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
      case "SETTINGS_UNREADABLE":
        return "\u3053\u306E\u30D0\u30FC\u30B8\u30E7\u30F3\u3067\u306F\u8A2D\u5B9A\u3092\u8AAD\u307F\u53D6\u308C\u307E\u305B\u3093\u3002\u62E1\u5F35\u6A5F\u80FD\u3092\u66F4\u65B0\u3059\u308B\u304B\u3001\u8A2D\u5B9A\u3092\u521D\u671F\u5316\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
    }
  })();
  return error.suggestion ? `${base}
${error.suggestion}` : base;
}
function ok(value) {
  return { ok: true, value };
}
function err(code, detail, suggestion) {
  const e = { code };
  if (detail !== void 0) e.detail = detail;
  if (suggestion !== void 0) e.suggestion = suggestion;
  return { ok: false, error: e };
}

// src/domain/year-span.ts
function makeSegment(era, from, to) {
  const eraYear = eraYearOf(era, from);
  return { era, eraYear, eraYearLabel: eraYearLabel(eraYear), from, to };
}
function coversFullYear(from, to) {
  return from.month === 1 && from.day === 1 && to.month === 12 && to.day === 31;
}
function segmentsOfGregorianYear(year) {
  const yearEnd = { year, month: 12, day: 31 };
  const segments = [];
  let cursor = { year, month: 1, day: 1 };
  while (compare(cursor, yearEnd) <= 0) {
    const era = eraForDate(cursor);
    if (!era) return [];
    const next = nextEra(era);
    const to = next && compare(next.start, yearEnd) <= 0 ? previousDay(next.start) : yearEnd;
    segments.push(makeSegment(era, cursor, to));
    cursor = nextDay(to);
  }
  return segments;
}
function segmentOfEraYear(era, eraYear) {
  if (!Number.isInteger(eraYear) || eraYear < 1) return null;
  const year = gregorianYearOf(era, eraYear);
  const yearStart = { year, month: 1, day: 1 };
  const yearEnd = { year, month: 12, day: 31 };
  const from = compare(era.start, yearStart) > 0 ? era.start : yearStart;
  const next = nextEra(era);
  const eraEnd = next ? previousDay(next.start) : null;
  const to = eraEnd && compare(eraEnd, yearEnd) < 0 ? eraEnd : yearEnd;
  if (compare(from, to) > 0) return null;
  return makeSegment(era, from, to);
}

// src/domain/parse-date.ts
var MAX_INPUT_CODE_POINTS = 64;
var MAX_LABEL_LENGTH = 12;
var MAX_COLONS = 1;
var ERA_NAMES = ERAS.map((e) => e.name).join("|");
var ERA_ABBRS = ERAS.map((e) => e.abbreviation).join("");
function codePointLength(s) {
  return [...s].length;
}
function dateLikeRegex() {
  return new RegExp(
    `(?:${ERA_NAMES}|[${ERA_ABBRS}])?(?:\u5143|\\d{1,4})[\u5E74/\\-.]\\d{1,2}[\u6708/\\-.]\\d{1,2}`,
    "gu"
  );
}
function countDateLike(s) {
  return (s.match(dateLikeRegex()) ?? []).length;
}
var GREGORIAN_YEAR_BARE = /^(\d{4})$/u;
var GREGORIAN_YEAR_JP = /^(\d{1,4})年$/u;
var ERA_YEAR = "(?:\u5143|\\d{1,3})";
function eraYearOnlyJpRegex() {
  return new RegExp(`^(${ERA_NAMES})(${ERA_YEAR})\u5E74$`, "u");
}
function eraYearOnlyAbbrRegex() {
  return new RegExp(`^([${ERA_ABBRS}${ERA_ABBRS.toLowerCase()}])(${ERA_YEAR})\u5E74?$`, "u");
}
function containsEraName(s) {
  return ERAS.some((e) => s.includes(e.name));
}
function stripLeadingLabel(s) {
  const colon = s.indexOf(":");
  if (colon < 0) return s;
  const label = s.slice(0, colon);
  const rest = s.slice(colon + 1);
  if (label.length > MAX_LABEL_LENGTH) return s;
  if (/\d/u.test(label)) return s;
  if (containsEraName(label)) return s;
  if (countDateLike(rest) !== 1) return s;
  return rest;
}
function normalizeInput(raw) {
  const afterNfkc = raw.normalize("NFKC").trim();
  let s = stripLeadingLabel(afterNfkc);
  s = s.replace(/[(（][日月火水木金土][)）]/g, "");
  for (; ; ) {
    const before = s;
    s = s.trim();
    s = s.replace(/(生まれ|出生|生)$/u, "");
    s = s.replace(/[、。,.]+$/u, "");
    if (s === before) break;
  }
  s = s.replace(/\s+/gu, "").trim();
  return { normalized: s, afterNfkc };
}
var GREGORIAN_SEPARATED = /^(\d{4})([/\-.])(\d{1,2})\2(\d{1,2})$/u;
var GREGORIAN_JP = /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/u;
function eraJpRegex() {
  return new RegExp(`^(${ERA_NAMES})(${ERA_YEAR})\u5E74(\\d{1,2})\u6708(\\d{1,2})\u65E5?$`, "u");
}
function eraAbbrRegex() {
  return new RegExp(`^([${ERA_ABBRS}${ERA_ABBRS.toLowerCase()}])(${ERA_YEAR})([/\\-.])(\\d{1,2})\\3(\\d{1,2})$`, "u");
}
function eraYearToNumber(token) {
  return token === "\u5143" ? 1 : Number(token);
}
function jp(year, month, day) {
  return `${year}\u5E74${month}\u6708${day}\u65E5`;
}
function buildFromGregorian(year, month, day) {
  if (!isValidDate(year, month, day)) return err("NONEXISTENT_DATE", jp(year, month, day));
  const date = makePlainDate(year, month, day);
  if (!date) return err("NONEXISTENT_DATE", jp(year, month, day));
  if (compare(date, MIN_SUPPORTED_DATE) < 0) return err("BELOW_MIN_DATE");
  return ok({ kind: "date", date, inputKind: "gregorian" });
}
function buildFromEra(era, eraYear, month, day) {
  if (eraYear < 1) return err("UNPARSABLE");
  const year = gregorianYearOf(era, eraYear);
  const label = `${era.name}${eraYearLabel(eraYear)}\u5E74${month}\u6708${day}\u65E5`;
  if (!isValidDate(year, month, day)) return err("NONEXISTENT_DATE", label);
  const date = makePlainDate(year, month, day);
  if (!date) return err("UNPARSABLE");
  if (compare(date, MIN_SUPPORTED_DATE) < 0) return err("BELOW_MIN_DATE");
  if (!isWithinEra(era, date)) {
    const next = nextEra(era);
    const startText = `${era.name}\u306F${jp(era.start.year, era.start.month, era.start.day)}\u958B\u59CB`;
    const endText = next ? `\u3001${next.name}\u306F${jp(next.start.year, next.start.month, next.start.day)}\u958B\u59CB` : "";
    const actualEra = ERAS.filter((e) => compare(e.start, date) <= 0).at(-1);
    const suggestion = actualEra ? `\u3053\u306E\u65E5\u4ED8\u306F ${actualEra.name}${eraYearLabel(date.year - actualEra.start.year + 1)}\u5E74${date.month}\u6708${date.day}\u65E5 \u3067\u3059\u3002` : void 0;
    return err("ERA_OUT_OF_RANGE", `${label}\u306F${era.name}\u306E\u671F\u9593\u5916\u3067\u3059\u3002${startText}${endText}\u3067\u3059\u3002`, suggestion);
  }
  return ok({ kind: "date", date, inputKind: "wareki" });
}
function buildFromGregorianYear(year) {
  if (year < MIN_SUPPORTED_DATE.year) return err("BELOW_MIN_DATE");
  return ok({ kind: "gregorianYear", year, inputKind: "gregorian" });
}
function buildFromEraYear(era, eraYear) {
  if (eraYear < 1) return err("UNPARSABLE");
  const segment = segmentOfEraYear(era, eraYear);
  const label = `${era.name}${eraYearLabel(eraYear)}\u5E74`;
  if (!segment) {
    const next = nextEra(era);
    const startText = `${era.name}\u306F${jp(era.start.year, era.start.month, era.start.day)}\u958B\u59CB`;
    const endText = next ? `\u3001${next.name}\u306F${jp(next.start.year, next.start.month, next.start.day)}\u958B\u59CB` : "";
    const actual = segmentsOfGregorianYear(gregorianYearOf(era, eraYear));
    const suggestion = actual.length > 0 ? `\u3053\u306E\u5E74\u306F ${actual.map((s) => `${s.era.name}${s.eraYearLabel}\u5E74`).join("\u30FB")} \u3067\u3059\u3002` : void 0;
    return err("ERA_OUT_OF_RANGE", `${label}\u306F${era.name}\u306E\u671F\u9593\u5916\u3067\u3059\u3002${startText}${endText}\u3067\u3059\u3002`, suggestion);
  }
  if (compare(segment.to, MIN_SUPPORTED_DATE) < 0) return err("BELOW_MIN_DATE");
  return ok({ kind: "eraYear", era, eraYear, inputKind: "wareki" });
}
function parseDateInput(raw) {
  const trimmed = raw.trim();
  if (trimmed === "") return err("EMPTY_INPUT");
  if (codePointLength(trimmed) > MAX_INPUT_CODE_POINTS) return err("TOO_LONG");
  const { normalized, afterNfkc } = normalizeInput(raw);
  if (normalized === "") return err("EMPTY_INPUT");
  const before = countDateLike(afterNfkc);
  const after = countDateLike(normalized);
  if (Math.max(before, after) >= 2) return err("MULTIPLE_DATES");
  if ((afterNfkc.match(/:/gu) ?? []).length > MAX_COLONS) return err("TOO_MANY_SEPARATORS");
  let m = GREGORIAN_YEAR_BARE.exec(normalized) ?? GREGORIAN_YEAR_JP.exec(normalized);
  if (m) return buildFromGregorianYear(Number(m[1]));
  m = eraYearOnlyJpRegex().exec(normalized);
  if (m) {
    const era = findEraByName(m[1]);
    if (!era) return err("UNPARSABLE");
    return buildFromEraYear(era, eraYearToNumber(m[2]));
  }
  m = eraYearOnlyAbbrRegex().exec(normalized);
  if (m) {
    const era = findEraByAbbreviation(m[1]);
    if (!era) return err("UNPARSABLE");
    return buildFromEraYear(era, eraYearToNumber(m[2]));
  }
  m = GREGORIAN_SEPARATED.exec(normalized);
  if (m) return buildFromGregorian(Number(m[1]), Number(m[3]), Number(m[4]));
  m = GREGORIAN_JP.exec(normalized);
  if (m) return buildFromGregorian(Number(m[1]), Number(m[2]), Number(m[3]));
  m = eraJpRegex().exec(normalized);
  if (m) {
    const era = findEraByName(m[1]);
    if (!era) return err("UNPARSABLE");
    return buildFromEra(era, eraYearToNumber(m[2]), Number(m[3]), Number(m[4]));
  }
  m = eraAbbrRegex().exec(normalized);
  if (m) {
    const era = findEraByAbbreviation(m[1]);
    if (!era) return err("UNPARSABLE");
    return buildFromEra(era, eraYearToNumber(m[2]), Number(m[4]), Number(m[5]));
  }
  return err("UNPARSABLE");
}

// src/domain/convert.ts
function convert(raw) {
  const parsed = parseDateInput(raw);
  if (!parsed.ok) return parsed;
  const input = parsed.value;
  if (input.kind === "date") {
    const wareki = formatWareki(input.date);
    if (!wareki) return err("BELOW_MIN_DATE");
    return ok({
      kind: "date",
      gregorian: input.date,
      wareki,
      inputKind: input.inputKind,
      transitions: transitionsInYear(input.date.year),
      // 確認期限は双方向に適用する。最新元号には次が無いため isWithinEra では検出できない。
      beyondVerified: compare(input.date, verifiedThrough()) > 0
    });
  }
  const segments = input.kind === "gregorianYear" ? segmentsOfGregorianYear(input.year) : [segmentOfEraYear(input.era, input.eraYear)].filter((s) => s !== null);
  const first = segments[0];
  const last = segments[segments.length - 1];
  if (!first || !last) return err("BELOW_MIN_DATE");
  return ok({
    kind: "year",
    gregorianYear: first.from.year,
    segments,
    from: first.from,
    to: last.to,
    inputKind: input.inputKind,
    transitions: transitionsInYear(first.from.year),
    beyondVerified: compare(last.to, verifiedThrough()) > 0
  });
}

// src/infrastructure/session-result.ts
var KEY = "lastResult";
async function takeSessionResult() {
  const raw = await chrome.storage.session.get(KEY);
  const v = raw[KEY];
  if (!v || typeof v !== "object") return null;
  await chrome.storage.session.remove(KEY);
  const o = v;
  if (typeof o.title !== "string" || typeof o.message !== "string") return null;
  return { title: o.title, message: o.message, notes: Array.isArray(o.notes) ? o.notes : [] };
}

// src/background/notifications.ts
async function clearBadge() {
  await chrome.action.setBadgeText({ text: "" });
  await chrome.action.setTitle({ title: "" });
}

// src/infrastructure/settings.ts
var CURRENT_SCHEMA_VERSION = 1;
var STORAGE_KEY = "settings";
var DEFAULT_SETTINGS = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  direction: "toWareki"
};
async function loadSettings() {
  const raw = await chrome.storage.local.get(STORAGE_KEY);
  const stored = raw[STORAGE_KEY];
  if (stored === void 0 || stored === null) {
    return { status: "ok", settings: { ...DEFAULT_SETTINGS } };
  }
  if (typeof stored !== "object") return { status: "unreadable", foundVersion: stored };
  const version = stored.schemaVersion;
  if (version !== CURRENT_SCHEMA_VERSION) return { status: "unreadable", foundVersion: version };
  const d = stored.direction;
  const direction = d === "toGregorian" ? "toGregorian" : "toWareki";
  return { status: "ok", settings: { schemaVersion: CURRENT_SCHEMA_VERSION, direction } };
}
async function saveSettings(settings) {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}
async function resetSettings() {
  const next = { ...DEFAULT_SETTINGS };
  await saveSettings(next);
  return next;
}

// src/presentation/format-result.ts
function formatDateJp(d) {
  return `${d.year}\u5E74${d.month}\u6708${d.day}\u65E5`;
}
function monthDayJp(d) {
  return `${d.month}\u6708${d.day}\u65E5`;
}
function transitionNotes(r) {
  return r.transitions.map(
    (t) => `${t.year}\u5E74\u306F${t.previousEraLastDay.month}\u6708${t.previousEraLastDay.day}\u65E5\u307E\u3067\u304C${t.previousEra.name}${t.previousEraYearLabel}\u5E74\u3001${t.nextEra.start.month}\u6708${t.nextEra.start.day}\u65E5\u304B\u3089\u304C${t.nextEra.name}\u5143\u5E74`
  );
}
function verificationNote(r) {
  if (!r.beyondVerified) return null;
  const v = verifiedThrough();
  return `\u3053\u306E\u65E5\u4ED8\u306F\u540C\u68B1\u306E\u5143\u53F7\u30C7\u30FC\u30BF\u78BA\u8A8D\u671F\u9650\uFF08${formatDateJp(v)}\uFF09\u3088\u308A\u5F8C\u3067\u3059\u3002\u4EE5\u964D\u306B\u6539\u5143\u304C\u3042\u3063\u305F\u5834\u5408\u3001\u6B63\u3057\u3044\u548C\u66A6\u306F\u7570\u306A\u308A\u307E\u3059\u3002`;
}
function warekiLines(r) {
  if (r.kind === "date") return [r.wareki];
  const showSpan = r.segments.length > 1;
  return r.segments.map((s) => {
    const base = `${s.era.name}${s.eraYearLabel}\u5E74`;
    return showSpan ? `${base}\uFF08${monthDayJp(s.from)}\u301C${monthDayJp(s.to)}\uFF09` : base;
  });
}
function gregorianLines(r) {
  if (r.kind === "date") return [formatDateJp(r.gregorian)];
  if (coversFullYear(r.from, r.to)) return [`${r.gregorianYear}\u5E74`];
  return [`${r.gregorianYear}\u5E74${monthDayJp(r.from)}\u301C${monthDayJp(r.to)}`];
}
function formatForPopup(r, direction) {
  const wareki = warekiLines(r);
  const gregorian = gregorianLines(r);
  const notes = [...transitionNotes(r)];
  const v = verificationNote(r);
  if (v) notes.push(v);
  return {
    primaryLines: direction === "toWareki" ? wareki : gregorian,
    secondaryLines: direction === "toWareki" ? gregorian : wareki,
    notes
  };
}
function formatForClipboard(r, direction) {
  const { primaryLines, secondaryLines } = formatForPopup(r, direction);
  return [...primaryLines, ...secondaryLines].join("\n");
}

// src/popup/popup.ts
function must(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element not found: ${id}`);
  return el;
}
function initPopup() {
  const el = {
    form: must("form"),
    input: must("input"),
    dirWareki: must("dir-wareki"),
    dirGregorian: must("dir-gregorian"),
    convert: must("convert"),
    error: must("error"),
    result: must("result"),
    primary: must("primary"),
    secondary: must("secondary"),
    notes: must("notes"),
    copy: must("copy"),
    copyStatus: must("copy-status"),
    warning: must("settings-warning"),
    warningText: must("settings-warning-text"),
    reset: must("reset-settings"),
    pending: must("pending"),
    pendingText: must("pending-text")
  };
  let settings = { ...DEFAULT_SETTINGS };
  let settingsReadable = false;
  let settingsLoaded = false;
  let lastResult = null;
  function setFormEnabled(enabled) {
    el.input.disabled = !enabled;
    el.convert.disabled = !enabled;
    el.dirWareki.disabled = !enabled;
    el.dirGregorian.disabled = !enabled;
  }
  function currentDirection() {
    return el.dirGregorian.checked ? "toGregorian" : "toWareki";
  }
  function setLines(target, lines) {
    target.replaceChildren();
    for (const line of lines) {
      const div = document.createElement("div");
      div.textContent = line;
      target.append(div);
    }
  }
  function clearResult() {
    lastResult = null;
    el.result.hidden = true;
    el.primary.replaceChildren();
    el.secondary.replaceChildren();
    el.notes.replaceChildren();
    el.notes.hidden = true;
    el.copyStatus.hidden = true;
  }
  function showError(message) {
    clearResult();
    el.error.textContent = message;
    el.error.hidden = false;
  }
  function render(result) {
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
  function persistSettings() {
    if (!settingsLoaded || !settingsReadable) return;
    const next = { schemaVersion: 1, direction: currentDirection() };
    settings = next;
    void saveSettings(next).catch((e) => console.error("saveSettings failed:", e));
  }
  function runConversion() {
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
      if (lastResult) render(lastResult);
    });
  }
  function fallbackToManualCopy() {
    el.copyStatus.textContent = "\u81EA\u52D5\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u7D50\u679C\u3092\u9078\u629E\u3057\u3066\u30B3\u30D4\u30FC\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
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
    void Promise.resolve().then(() => navigator.clipboard.writeText(formatForClipboard(result, currentDirection()))).then(() => {
      el.copyStatus.textContent = "\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F\u3002";
      el.copyStatus.hidden = false;
    }).catch(fallbackToManualCopy).finally(() => {
      el.copy.disabled = false;
    });
  });
  el.reset.addEventListener("click", () => {
    el.reset.disabled = true;
    void resetSettings().then((next) => {
      settings = next;
      settingsReadable = true;
      settingsLoaded = true;
      el.warning.hidden = true;
      el.dirWareki.checked = true;
      setFormEnabled(true);
    }).catch((e) => console.error("resetSettings failed:", e)).finally(() => {
      el.reset.disabled = false;
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") window.close();
  });
  void loadSettings().then((load) => {
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
  }).catch((e) => {
    console.error("loadSettings failed:", e);
    settingsReadable = false;
    el.warningText.textContent = messageFor({ code: "SETTINGS_UNREADABLE" });
    el.warning.hidden = false;
  }).finally(() => {
    settingsLoaded = true;
    setFormEnabled(true);
    el.input.focus();
  });
  void takeSessionResult().then((pending) => {
    if (!pending) return;
    const lines = [pending.title, pending.message, ...pending.notes];
    el.pendingText.textContent = `\u901A\u77E5\u304C\u8868\u793A\u3067\u304D\u306A\u304B\u3063\u305F\u76F4\u524D\u306E\u7D50\u679C\uFF1A${lines.join(" / ")}`;
    el.pending.hidden = false;
  }).catch((e) => console.error("takeSessionResult failed:", e));
  void clearBadge().catch(() => {
  });
  setFormEnabled(false);
}
if (typeof document !== "undefined" && document.getElementById("form")) {
  initPopup();
}
export {
  initPopup
};
