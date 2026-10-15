import csvParser from "csv-parser";

type CsvRow = Record<string, string>;

/**
 * Reads a CSV upload and reports the rows `mapRow` keeps (it returns
 * `undefined` to skip a row). Exactly one of `onParsed` or `onError` runs for
 * a file that can be read; `onError` also runs when the file cannot be read.
 */
export function parseCsvFile<T>(
  file: File,
  mapRow: (row: CsvRow, index: number) => T | undefined,
  onParsed: (rows: T[]) => void,
  onError: () => void
) {
  const reader = new FileReader();

  reader.onload = () => {
    const rows: T[] = [];
    let index = 0;

    const parser = csvParser({ headers: true })
      .on("data", (row: CsvRow) => {
        const mapped = mapRow(row, index);
        index += 1;
        if (mapped !== undefined) {
          rows.push(mapped);
        }
      })
      .on("end", () => {
        onParsed(rows);
      })
      .on("error", (err: Error) => {
        console.error(err);
        onError();
      });

    parser.write(reader.result);
    parser.end();
  };
  reader.onerror = onError;

  reader.readAsText(file);
}
