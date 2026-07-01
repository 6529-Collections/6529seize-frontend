import {
  dateFromMintNumber,
  displayedYearNumberFromIndex,
  getSeasonIndexForDate,
} from "@/components/meme-calendar/meme-calendar.helpers";
import type { MemeSeason } from "@/entities/ISeason";

type MemeYear = {
  readonly id: number;
  readonly display: string;
};

export function getMemeYearFromMintNumber(mintNumber: number): number | null {
  if (!Number.isInteger(mintNumber) || mintNumber <= 0) {
    return null;
  }

  return displayedYearNumberFromIndex(
    getSeasonIndexForDate(dateFromMintNumber(mintNumber))
  );
}

export function getMemeYearFromSeason(season: MemeSeason): number | null {
  return getMemeYearFromMintNumber(season.start_index);
}

export function getMemeYears(seasons: readonly MemeSeason[]): MemeYear[] {
  const years = new Set(
    seasons
      .map(getMemeYearFromSeason)
      .filter((year): year is number => year !== null)
  );

  return Array.from(years)
    .toSorted((a, b) => a - b)
    .map((year) => ({
      id: year,
      display: `Year ${year}`,
    }));
}

export function getMemeSeasonsForYear({
  seasons,
  yearId,
}: {
  readonly seasons: readonly MemeSeason[];
  readonly yearId: number | null;
}): MemeSeason[] {
  if (yearId === null) {
    return [...seasons];
  }

  return seasons.filter((season) => getMemeYearFromSeason(season) === yearId);
}

export function getAllSeasonsLabel(yearId: number | null): string {
  return yearId === null ? "All Seasons" : `All Year ${yearId} Seasons`;
}

export function normalizeMemeFilterIds({
  seasonId,
  seasons,
  yearId,
}: {
  readonly seasonId: number | null;
  readonly seasons: readonly MemeSeason[];
  readonly yearId: number | null;
}): {
  readonly seasonId: number | null;
  readonly yearId: number | null;
} {
  if (seasons.length === 0) {
    return { seasonId, yearId };
  }

  const yearExists =
    yearId === null ||
    seasons.some((season) => getMemeYearFromSeason(season) === yearId);

  if (!yearExists) {
    return { seasonId: null, yearId: null };
  }

  if (seasonId === null) {
    return { seasonId: null, yearId };
  }

  const season = seasons.find((candidate) => candidate.id === seasonId);

  if (season === undefined) {
    return { seasonId: null, yearId: null };
  }

  if (yearId !== null && getMemeYearFromSeason(season) !== yearId) {
    return { seasonId: null, yearId: null };
  }

  return { seasonId, yearId };
}

export function getMemeApiSeasonIds({
  seasonId,
  seasons,
  yearId,
}: {
  readonly seasonId: number | null;
  readonly seasons: readonly MemeSeason[];
  readonly yearId: number | null;
}): number[] {
  if (seasonId !== null) {
    return [seasonId];
  }

  if (yearId === null) {
    return [];
  }

  return getMemeSeasonsForYear({ seasons, yearId }).map((season) => season.id);
}
