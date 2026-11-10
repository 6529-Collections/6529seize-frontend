/**
 * CSV files the app builds for download. Every cell is quoted when needed,
 * and a cell a spreadsheet would read as a formula is written as text.
 */

// Spreadsheets treat a cell starting with one of these as a formula.
const FORMULA_START_PATTERN = /^[=+\-@\t\r]/;
const FORMULA_TEXT_PREFIX = "'";
const NEEDS_QUOTES_PATTERN = /[",\n\r]/;

// A plain number, such as -5 or -0.25, stays a number.
const isPlainNumber = (text: string): boolean =>
  text !== "" && text.trim() === text && Number.isFinite(Number(text));

function cellText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return value.toString();
  }
  // JSON cannot represent these; anything else here is an object.
  if (typeof value === "function" || typeof value === "symbol") {
    return "";
  }
  return JSON.stringify(value);
}

/** One CSV cell: formula-like text is prefixed with `'`, then quoted if needed. */
export function toCsvCell(value: unknown): string {
  const text = cellText(value);
  const safeText =
    FORMULA_START_PATTERN.test(text) && !isPlainNumber(text)
      ? `${FORMULA_TEXT_PREFIX}${text}`
      : text;
  return NEEDS_QUOTES_PATTERN.test(safeText)
    ? `"${safeText.replaceAll('"', '""')}"`
    : safeText;
}

/** Rows of cells as CSV text, one line per row. */
export function buildCsv(rows: ReadonlyArray<ReadonlyArray<unknown>>): string {
  return rows.map((row) => row.map(toCsvCell).join(",")).join("\n");
}

/**
 * A header row from the first record's keys, then one row per record with
 * the values of those keys, so a missing or extra field cannot shift columns.
 */
export function buildCsvFromRecords(records: readonly object[]): string {
  const [first] = records;
  if (!first) {
    return "";
  }
  const keys = Object.keys(first);
  return buildCsv([
    keys,
    ...records.map((record) => {
      const fields = new Map<string, unknown>(Object.entries(record));
      return keys.map((key) => fields.get(key));
    }),
  ]);
}

/**
 * Reads back a cell written by `toCsvCell`, for CSV files the app exported
 * and a person uploads again: the `'` added before formula-like text is
 * removed, so cells written by `toCsvCell` round-trip. It cannot tell that
 * prefix from an apostrophe typed by hand before such text in an uploaded
 * file, so that cell loses its apostrophe. Other cells are unchanged.
 */
export function readCsvCell(cell: string): string {
  if (
    cell.startsWith(FORMULA_TEXT_PREFIX) &&
    FORMULA_START_PATTERN.test(cell.slice(1))
  ) {
    return cell.slice(1);
  }
  return cell;
}
