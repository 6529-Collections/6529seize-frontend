import { compareLocalized } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import csvParser from "csv-parser";

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

function parsePrimaryAddressCsv(
  csvContent: string
): Promise<PrimaryAddressData[]> {
  return new Promise((resolve, reject) => {
    const results: PrimaryAddressData[] = [];
    const seenProfileIds = new Set<string>();

    const parser = csvParser({ headers: false })
      .on("data", (row: Record<string, string>) => {
        const profileId = row["0"]?.trim();
        const handle = row["1"]?.trim();
        const currentPrimary = row["2"]?.trim();
        const newPrimary = row["3"]?.trim();

        if (
          profileId === "profile_id" &&
          handle === "handle" &&
          currentPrimary === "current_primary" &&
          newPrimary === "new_primary"
        ) {
          return;
        }

        if (
          !profileId ||
          !handle ||
          !currentPrimary ||
          !newPrimary ||
          seenProfileIds.has(profileId)
        ) {
          return;
        }

        seenProfileIds.add(profileId);
        results.push({
          profile_id: profileId,
          handle,
          current_primary: currentPrimary,
          new_primary: newPrimary,
        });
      })
      .on("end", () => {
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
