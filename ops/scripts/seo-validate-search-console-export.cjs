#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const PERFORMANCE_HEADERS = [
  "date",
  "page_type",
  "device",
  "country",
  "query_class",
  "clicks",
  "impressions",
  "ctr",
  "position",
];
const INSPECTION_HEADERS = [
  "checked_on",
  "page_type",
  "url",
  "submitted_sitemap",
  "indexing_state",
  "google_canonical",
  "last_crawl",
];
const PAGE_TYPES = new Set([
  "homepage",
  "collection",
  "artwork",
  "museum",
  "education",
  "profile",
  "wave",
  "other",
]);
const DEVICES = new Set(["DESKTOP", "MOBILE", "TABLET"]);
const QUERY_CLASSES = new Set(["brand", "non_brand", "unknown"]);
const ARGUMENT_KEYS = new Set(["kind", "input", "output"]);

function usage() {
  return [
    "Usage:",
    "  node ops/scripts/seo-validate-search-console-export.cjs --kind performance|inspection --input <csv> [--output <json>]",
  ].join("\n");
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; ) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag?.startsWith("--")) throw new Error(usage());
    const key = flag.slice(2);
    if (
      !ARGUMENT_KEYS.has(key) ||
      !value ||
      value.startsWith("--") ||
      result[key] !== undefined
    ) {
      throw new Error(usage());
    }
    result[key] = value;
    index += 2;
  }
  if (
    !result.kind ||
    !result.input ||
    !["performance", "inspection"].includes(result.kind)
  ) {
    throw new Error(usage());
  }
  return result;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field");
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((values) => values.some((value) => value !== ""));
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function validatePerformance(record, rowNumber, errors) {
  if (!isIsoDate(record.date))
    errors.push(`row ${rowNumber}: date must be YYYY-MM-DD`);
  if (!PAGE_TYPES.has(record.page_type))
    errors.push(`row ${rowNumber}: unsupported page_type`);
  if (!DEVICES.has(record.device))
    errors.push(`row ${rowNumber}: device must be DESKTOP, MOBILE, or TABLET`);
  if (!/^[a-z]{3}$/i.test(record.country))
    errors.push(`row ${rowNumber}: country must be a three-letter code`);
  if (!QUERY_CLASSES.has(record.query_class))
    errors.push(`row ${rowNumber}: unsupported query_class`);
  validatePerformanceMetrics(record, rowNumber, errors);
}

function validatePerformanceMetrics(record, rowNumber, errors) {
  const clicks = strictUnsignedInteger(record.clicks);
  const impressions = strictUnsignedInteger(record.impressions);
  const ctr = strictUnsignedDecimal(record.ctr);
  const position = strictUnsignedDecimal(record.position);
  if (!Number.isInteger(clicks))
    errors.push(`row ${rowNumber}: clicks must be a non-negative integer`);
  if (!Number.isInteger(impressions))
    errors.push(`row ${rowNumber}: impressions must be a non-negative integer`);
  if (!Number.isFinite(ctr) || ctr < 0 || ctr > 1)
    errors.push(`row ${rowNumber}: ctr must be a decimal from 0 through 1`);
  if (!Number.isFinite(position) || position < 0)
    errors.push(`row ${rowNumber}: position must be non-negative`);
  if (
    Number.isFinite(clicks) &&
    Number.isFinite(impressions) &&
    impressions > 0 &&
    Number.isFinite(ctr) &&
    Math.abs(ctr - clicks / impressions) > 0.0001
  ) {
    errors.push(
      `row ${rowNumber}: ctr does not equal clicks / impressions within 0.0001`
    );
  }
  if (impressions === 0 && ctr !== 0)
    errors.push(`row ${rowNumber}: ctr must be 0 when impressions are 0`);
  if (impressions > 0 && position < 1)
    errors.push(`row ${rowNumber}: position must be at least 1`);
  if (impressions === 0 && position !== 0)
    errors.push(`row ${rowNumber}: position must be 0 when impressions are 0`);
}

function strictUnsignedInteger(value) {
  if (value.length === 0 || value.trim() !== value) return Number.NaN;
  return [...value].every((character) => character >= "0" && character <= "9")
    ? Number(value)
    : Number.NaN;
}

function strictUnsignedDecimal(value) {
  if (
    value.length === 0 ||
    value.trim() !== value ||
    value.startsWith(".") ||
    value.endsWith(".")
  ) {
    return Number.NaN;
  }
  let decimalPoints = 0;
  for (const character of value) {
    if (character === ".") decimalPoints += 1;
    else if (character < "0" || character > "9") return Number.NaN;
  }
  return decimalPoints <= 1 ? Number(value) : Number.NaN;
}

function validateOptionalDateField(record, field, rowNumber, errors) {
  if (record[field] && !isIsoDate(record[field])) {
    errors.push(`row ${rowNumber}: ${field} must be blank or YYYY-MM-DD`);
  }
}

function validateHttpsField(
  record,
  field,
  rowNumber,
  errors,
  { allowBlank = false } = {}
) {
  if (allowBlank && !record[field]) return;
  try {
    const url = new URL(record[field]);
    if (url.protocol !== "https:") throw new Error("not HTTPS");
  } catch {
    errors.push(
      `row ${rowNumber}: ${field} must be${allowBlank ? " blank or" : ""} an HTTPS URL`
    );
  }
}

function validateInspection(record, rowNumber, errors) {
  if (!isIsoDate(record.checked_on))
    errors.push(`row ${rowNumber}: checked_on must be YYYY-MM-DD`);
  validateOptionalDateField(record, "last_crawl", rowNumber, errors);
  if (!PAGE_TYPES.has(record.page_type))
    errors.push(`row ${rowNumber}: unsupported page_type`);
  validateHttpsField(record, "url", rowNumber, errors);
  validateHttpsField(record, "google_canonical", rowNumber, errors, {
    allowBlank: true,
  });
  if (!/^(true|false)$/i.test(record.submitted_sitemap))
    errors.push(`row ${rowNumber}: submitted_sitemap must be true or false`);
  if (!record.indexing_state.trim())
    errors.push(`row ${rowNumber}: indexing_state is required`);
}

function validate(kind, input) {
  const rows = parseCsv(input);
  if (rows.length < 2)
    throw new Error("CSV must contain a header and at least one data row");
  const headers =
    kind === "performance" ? PERFORMANCE_HEADERS : INSPECTION_HEADERS;
  if (rows[0].join(",") !== headers.join(",")) {
    throw new Error(`CSV header must be exactly: ${headers.join(",")}`);
  }
  const errors = [];
  const records = rows.slice(1).map((values, offset) => {
    const rowNumber = offset + 2;
    if (values.length !== headers.length) {
      errors.push(
        `row ${rowNumber}: expected ${headers.length} columns, found ${values.length}`
      );
    }
    const record = Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    );
    if (kind === "performance") validatePerformance(record, rowNumber, errors);
    else validateInspection(record, rowNumber, errors);
    return record;
  });
  if (errors.length) throw new Error(errors.join("\n"));
  const dates = records
    .map((record) => (kind === "performance" ? record.date : record.checked_on))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
  return {
    kind,
    valid: true,
    rows: records.length,
    dateRange: { start: dates[0], end: dates.at(-1) },
    pageTypes: [...new Set(records.map((record) => record.page_type))].sort(
      (left, right) => left.localeCompare(right)
    ),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- The operator supplies an explicit protected local Search Console export path.
  const result = validate(args.kind, fs.readFileSync(args.input, "utf8"));
  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (args.output) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The operator explicitly chooses the local validation-receipt destination.
    fs.writeFileSync(path.resolve(args.output), serialized, "utf8");
  }
  process.stdout.write(serialized);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { validate };
