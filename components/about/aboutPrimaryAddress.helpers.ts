import { compareLocalized } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { isAddress } from "viem";

export interface PrimaryAddressData {
  readonly profile_id: string;
  readonly handle: string;
  readonly current_primary: string;
  readonly new_primary: string;
}

export const PRIMARY_ADDRESS_QUERY_KEY = ["primaryAddressData"] as const;
const PRIMARY_ADDRESS_SORT_OPTIONS = {
  numeric: false,
  sensitivity: "variant",
} satisfies Intl.CollatorOptions;

export function sortPrimaryAddressData(
  data: readonly PrimaryAddressData[],
  locale: SupportedLocale
): PrimaryAddressData[] {
  return [...data].sort((left, right) =>
    compareLocalized(
      locale,
      left.handle,
      right.handle,
      PRIMARY_ADDRESS_SORT_OPTIONS
    )
  );
}

export async function fetchPrimaryAddressData(): Promise<PrimaryAddressData[]> {
  const response = await fetch("/primary_address.csv");
  if (!response.ok) {
    throw new Error(
      `Failed to fetch primary address data (${response.status})`
    );
  }

  const csvContent = await response.text();
  return parsePrimaryAddressCsv(csvContent);
}

function parsePrimaryAddressCsv(csvContent: string): PrimaryAddressData[] {
  const results: PrimaryAddressData[] = [];
  const seenProfileIds = new Set<string>();

  let rows: string[][];
  try {
    rows = parseCsvRows(csvContent);
  } catch (error) {
    console.error(error);
    throw new Error("Failed to parse primary address data");
  }

  for (const row of rows) {
    if (row.length !== 4) {
      continue;
    }

    const [rawProfileId, rawHandle, rawCurrentPrimary, rawNewPrimary] = row;
    const profileId = rawProfileId?.replace(/^\uFEFF/, "").trim();
    const handle = rawHandle?.trim();
    const currentPrimary = rawCurrentPrimary?.trim();
    const newPrimary = rawNewPrimary?.trim();

    if (
      profileId === "profile_id" &&
      handle === "handle" &&
      currentPrimary === "current_primary" &&
      newPrimary === "new_primary"
    ) {
      continue;
    }

    if (
      !profileId ||
      !handle ||
      !currentPrimary ||
      !newPrimary ||
      !isAddress(currentPrimary) ||
      !isAddress(newPrimary) ||
      seenProfileIds.has(profileId)
    ) {
      continue;
    }

    seenProfileIds.add(profileId);
    results.push({
      profile_id: profileId,
      handle,
      current_primary: currentPrimary,
      new_primary: newPrimary,
    });
  }

  return results;
}

interface CsvParserState {
  readonly rows: string[][];
  row: string[];
  field: string;
  inQuotes: boolean;
}

function flushCsvField(state: CsvParserState) {
  state.row.push(state.field);
  state.field = "";
}

function flushCsvRow(state: CsvParserState) {
  flushCsvField(state);
  if (state.row.some((value) => value.trim().length > 0)) {
    state.rows.push(state.row);
  }
  state.row = [];
}

function processCsvQuote(
  state: CsvParserState,
  character: string,
  nextCharacter: string
): number {
  if (character !== '"') {
    return 0;
  }
  if (state.inQuotes && nextCharacter === '"') {
    state.field += '"';
    return 2;
  }
  state.inQuotes = !state.inQuotes;
  return 1;
}

function processCsvDelimiter(
  state: CsvParserState,
  character: string
): boolean {
  if (character === "," && !state.inQuotes) {
    flushCsvField(state);
    return true;
  }
  return false;
}

function processCsvLineBreak(
  state: CsvParserState,
  character: string,
  nextCharacter: string
): number {
  if ((character === "\n" || character === "\r") && !state.inQuotes) {
    flushCsvRow(state);
    return character === "\r" && nextCharacter === "\n" ? 2 : 1;
  }
  return 0;
}

function parseCsvRows(csvContent: string): string[][] {
  const state: CsvParserState = {
    rows: [],
    row: [],
    field: "",
    inQuotes: false,
  };

  for (let index = 0; index < csvContent.length; index++) {
    const character = csvContent.charAt(index);
    const nextCharacter = csvContent.charAt(index + 1);

    const quoteLength = processCsvQuote(state, character, nextCharacter);
    if (quoteLength > 0) {
      index += quoteLength - 1;
      continue;
    }

    if (processCsvDelimiter(state, character)) {
      continue;
    }

    const lineBreakLength = processCsvLineBreak(
      state,
      character,
      nextCharacter
    );
    if (lineBreakLength > 0) {
      index += lineBreakLength - 1;
      continue;
    }

    state.field += character;
  }

  if (state.inQuotes) {
    throw new Error("Unterminated quoted CSV field");
  }

  if (state.field.length > 0 || state.row.length > 0) {
    flushCsvRow(state);
  }

  return state.rows;
}
