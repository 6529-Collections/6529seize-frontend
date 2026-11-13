import csvParser from "csv-parser";
import { readCsvCell } from "@/helpers/csv-export.helpers";

type CsvRow = Record<string, string>;

const readCsvRow = (row: CsvRow): CsvRow =>
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, readCsvCell(value)])
  );

/**
 * Reads a CSV upload and reports the rows `mapRow` keeps (it returns
 * `undefined` to skip a row). Exactly one of `onParsed` or `onError` runs:
 * `onError` runs when the file cannot be read or the CSV cannot be parsed.
 * Cells are read back as `buildCsv` wrote them, so a file these tools
 * exported can be uploaded again.
 */
export async function parseCsvFile<T>(
  file: File,
  mapRow: (row: CsvRow, index: number) => T | undefined,
  onParsed: (rows: T[]) => void,
  onError: () => void
): Promise<void> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    onError();
    return;
  }

  const rows: T[] = [];
  let index = 0;

  const parser = csvParser({ headers: true })
    .on("data", (row: CsvRow) => {
      const mapped = mapRow(readCsvRow(row), index);
      index += 1;
      if (mapped !== undefined) {
        rows.push(mapped);
      }
    })
    .on("end", () => {
      onParsed(rows);
    })
    .on("error", () => {
      onError();
    });

  parser.write(text);
  parser.end();
}
