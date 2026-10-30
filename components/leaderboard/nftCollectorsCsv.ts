import type { NftTDH } from "./NFTLeaderboard";

const CSV_HEADERS = [
  "rank",
  "collector",
  "primary_wallet",
  "balance",
  "card_tdh",
  "card_unweighted_tdh",
  "total_balance",
  "total_tdh",
  "total_unweighted_tdh",
] as const;

function getCollectorCsvName(collector: NftTDH) {
  const nameCandidates: ReadonlyArray<string | null | undefined> = [
    collector.handle,
    collector.consolidation_display,
    collector.consolidation_key,
  ];
  const populatedName = nameCandidates.find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0
  );

  return populatedName ?? "";
}

function escapeCsvValue(value: number | string | null | undefined) {
  const rawValue = value === null || value === undefined ? "" : `${value}`;
  const stringValue = /^[=+\-@\t]/.test(rawValue) ? `'${rawValue}` : rawValue;

  if (!/[",\n\r]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replaceAll('"', '""')}"`;
}

export function buildNftCollectorsCsv(
  collectors: readonly NftTDH[],
  isSearchFiltered: boolean
) {
  const rows = collectors.map((collector, index) => {
    const rank = isSearchFiltered ? collector.tdh_rank : index + 1;

    return [
      rank,
      getCollectorCsvName(collector),
      collector.primary_wallet,
      collector.balance,
      collector.boosted_tdh,
      collector.tdh__raw,
      collector.total_balance,
      collector.total_boosted_tdh,
      collector.total_tdh__raw,
    ]
      .map(escapeCsvValue)
      .join(",");
  });

  return `${[CSV_HEADERS.join(","), ...rows].join("\n")}\n`;
}

export function downloadNftCollectorsCsv(nftId: number, csv: string) {
  if (
    typeof document === "undefined" ||
    typeof globalThis.URL.createObjectURL !== "function"
  ) {
    throw new TypeError("CSV downloads are unavailable in this browser.");
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement("a");

  try {
    link.href = url;
    link.download = `the-memes-${nftId}-collectors.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    globalThis.URL.revokeObjectURL(url);
  }
}
