// ------------------ Historical (SZN1) mints: Jun-Dec 2022 ------------------
type HistoricalMint = { id: number; instantUtc: Date };

// Keep in ascending id order.
export const HISTORICAL_MINTS: HistoricalMint[] = [
  { id: 1, instantUtc: new Date(Date.UTC(2022, 5, 9, 17, 1, 18)) },
  { id: 2, instantUtc: new Date(Date.UTC(2022, 5, 9, 17, 17, 45)) },
  { id: 3, instantUtc: new Date(Date.UTC(2022, 5, 9, 17, 22, 57)) },
  { id: 4, instantUtc: new Date(Date.UTC(2022, 5, 29, 15, 36, 35)) },
  { id: 5, instantUtc: new Date(Date.UTC(2022, 6, 8, 15, 43, 51)) },
  { id: 6, instantUtc: new Date(Date.UTC(2022, 6, 14, 15, 55, 39)) },
  { id: 7, instantUtc: new Date(Date.UTC(2022, 6, 20, 20, 11, 59)) },
  { id: 8, instantUtc: new Date(Date.UTC(2022, 6, 23, 15, 20, 38)) },
  { id: 9, instantUtc: new Date(Date.UTC(2022, 7, 3, 12, 46, 27)) },
  { id: 10, instantUtc: new Date(Date.UTC(2022, 7, 17, 19, 52, 51)) },
  { id: 11, instantUtc: new Date(Date.UTC(2022, 7, 25, 15, 21, 56)) },
  { id: 12, instantUtc: new Date(Date.UTC(2022, 7, 25, 15, 37, 12)) },
  { id: 13, instantUtc: new Date(Date.UTC(2022, 7, 29, 19, 6, 8)) },
  { id: 14, instantUtc: new Date(Date.UTC(2022, 7, 31, 13, 57, 22)) },
  { id: 15, instantUtc: new Date(Date.UTC(2022, 8, 7, 14, 39, 49)) },
  { id: 16, instantUtc: new Date(Date.UTC(2022, 8, 20, 14, 36, 47)) },
  { id: 17, instantUtc: new Date(Date.UTC(2022, 8, 27, 14, 50, 35)) },
  { id: 18, instantUtc: new Date(Date.UTC(2022, 8, 28, 14, 15, 23)) },
  { id: 19, instantUtc: new Date(Date.UTC(2022, 8, 29, 13, 2, 35)) },
  { id: 20, instantUtc: new Date(Date.UTC(2022, 9, 3, 14, 28, 59)) },
  { id: 21, instantUtc: new Date(Date.UTC(2022, 9, 4, 15, 26, 23)) },
  { id: 22, instantUtc: new Date(Date.UTC(2022, 9, 5, 15, 10, 47)) },
  { id: 23, instantUtc: new Date(Date.UTC(2022, 9, 6, 14, 29, 35)) },
  { id: 24, instantUtc: new Date(Date.UTC(2022, 9, 7, 13, 43, 11)) },
  { id: 25, instantUtc: new Date(Date.UTC(2022, 9, 13, 17, 6, 35)) },
  { id: 26, instantUtc: new Date(Date.UTC(2022, 9, 20, 14, 35, 23)) },
  { id: 27, instantUtc: new Date(Date.UTC(2022, 9, 21, 15, 43, 11)) },
  { id: 28, instantUtc: new Date(Date.UTC(2022, 9, 24, 13, 42, 11)) },
  { id: 29, instantUtc: new Date(Date.UTC(2022, 9, 26, 15, 58, 11)) },
  { id: 30, instantUtc: new Date(Date.UTC(2022, 9, 28, 15, 3, 23)) },
  { id: 31, instantUtc: new Date(Date.UTC(2022, 9, 31, 14, 32, 35)) },
  { id: 32, instantUtc: new Date(Date.UTC(2022, 10, 2, 14, 56, 11)) },
  { id: 33, instantUtc: new Date(Date.UTC(2022, 10, 7, 16, 5, 47)) },
  { id: 34, instantUtc: new Date(Date.UTC(2022, 10, 9, 17, 8, 47)) },
  { id: 35, instantUtc: new Date(Date.UTC(2022, 10, 14, 15, 54, 35)) },
  { id: 36, instantUtc: new Date(Date.UTC(2022, 10, 16, 15, 5, 11)) },
  { id: 37, instantUtc: new Date(Date.UTC(2022, 10, 18, 14, 21, 11)) },
  { id: 38, instantUtc: new Date(Date.UTC(2022, 10, 23, 14, 59, 35)) },
  { id: 39, instantUtc: new Date(Date.UTC(2022, 10, 28, 13, 26, 47)) },
  { id: 40, instantUtc: new Date(Date.UTC(2022, 10, 30, 11, 45, 47)) },
  { id: 41, instantUtc: new Date(Date.UTC(2022, 11, 2, 12, 12, 35)) },
  { id: 42, instantUtc: new Date(Date.UTC(2022, 11, 5, 15, 27, 59)) },
  { id: 43, instantUtc: new Date(Date.UTC(2022, 11, 7, 12, 15, 23)) },
  { id: 44, instantUtc: new Date(Date.UTC(2022, 11, 9, 14, 32, 59)) },
  { id: 45, instantUtc: new Date(Date.UTC(2022, 11, 12, 13, 59, 59)) },
  { id: 46, instantUtc: new Date(Date.UTC(2022, 11, 14, 12, 45, 47)) },
  { id: 47, instantUtc: new Date(Date.UTC(2022, 11, 16, 12, 26, 47)) },
];

export function getHistoricalMintsOnUtcDay(utcDay: Date): HistoricalMint[] {
  const y = utcDay.getUTCFullYear();
  const m = utcDay.getUTCMonth();
  const d = utcDay.getUTCDate();
  return HISTORICAL_MINTS.filter(
    (x) =>
      x.instantUtc.getUTCFullYear() === y &&
      x.instantUtc.getUTCMonth() === m &&
      x.instantUtc.getUTCDate() === d
  );
}
