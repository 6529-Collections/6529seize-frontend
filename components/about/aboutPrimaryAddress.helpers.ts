import csvParser from "csv-parser";

export interface PrimaryAddressData {
  readonly profile_id: string;
  readonly handle: string;
  readonly current_primary: string;
  readonly new_primary: string;
}

export const PRIMARY_ADDRESS_QUERY_KEY = ["primaryAddressData"] as const;

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

function parsePrimaryAddressCsv(
  csvContent: string
): Promise<PrimaryAddressData[]> {
  return new Promise((resolve, reject) => {
    const results: PrimaryAddressData[] = [];

    const parser = csvParser({ headers: false })
      .on("data", (row: Record<string, string>) => {
        results.push({
          profile_id: row["0"]!,
          handle: row["1"]!,
          current_primary: row["2"]!,
          new_primary: row["3"]!,
        });
      })
      .on("end", () => {
        results.sort((left, right) => left.handle.localeCompare(right.handle));
        resolve(results);
      })
      .on("error", (err: Error) => {
        console.error(err);
        reject(new Error("Failed to parse primary address data"));
      });

    try {
      parser.write(csvContent);
      parser.end();
    } catch (err) {
      console.error(err);
      reject(new Error("Failed to parse primary address data"));
    }
  });
}
