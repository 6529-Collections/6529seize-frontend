import {
  getAllSeasonsLabel,
  getMemeApiSeasonIds,
  getMemeSeasonsForYear,
  getMemeYearFromSeason,
  getMemeYears,
  normalizeMemeFilterIds,
} from "@/components/the-memes/theMemesFilters";
import type { MemeSeason } from "@/entities/ISeason";

const seasons = Array.from({ length: 17 }, (_, index): MemeSeason => {
  const id = index + 1;
  return {
    id,
    start_index: id * 10,
    end_index: id * 10 + 9,
    count: 10,
    name: `SZN${id}`,
    display: `SZN ${id}`,
    boost: 0.05,
  };
});

describe("theMemesFilters", () => {
  it("maps seasons to the existing Meme Calendar year model", () => {
    expect(getMemeYearFromSeason(1)).toBe(0);
    expect(getMemeYearFromSeason(2)).toBe(1);
    expect(getMemeYearFromSeason(5)).toBe(1);
    expect(getMemeYearFromSeason(6)).toBe(2);
    expect(getMemeYearFromSeason(13)).toBe(3);
    expect(getMemeYearFromSeason(14)).toBe(4);
    expect(getMemeYearFromSeason(17)).toBe(4);
  });

  it("derives available years and scoped seasons from loaded season data", () => {
    expect(getMemeYears(seasons.slice(0, 16))).toEqual([
      { id: 0, display: "Year 0" },
      { id: 1, display: "Year 1" },
      { id: 2, display: "Year 2" },
      { id: 3, display: "Year 3" },
      { id: 4, display: "Year 4" },
    ]);
    expect(
      getMemeSeasonsForYear({ seasons, yearId: 1 }).map((season) => season.id)
    ).toEqual([2, 3, 4, 5]);
    expect(
      getMemeSeasonsForYear({ seasons, yearId: 0 }).map((season) => season.id)
    ).toEqual([1]);
  });

  it("normalizes impossible year and season pairs back to defaults", () => {
    expect(normalizeMemeFilterIds({ seasonId: 1, seasons, yearId: 4 })).toEqual(
      {
        seasonId: null,
        yearId: null,
      }
    );
    expect(
      normalizeMemeFilterIds({ seasonId: 16, seasons, yearId: 4 })
    ).toEqual({
      seasonId: 16,
      yearId: 4,
    });
    expect(
      normalizeMemeFilterIds({ seasonId: null, seasons, yearId: 99 })
    ).toEqual({
      seasonId: null,
      yearId: null,
    });
  });

  it("builds API season ids for specific seasons and whole years", () => {
    expect(getMemeApiSeasonIds({ seasonId: 6, seasons, yearId: 2 })).toEqual([
      6,
    ]);
    expect(getMemeApiSeasonIds({ seasonId: null, seasons, yearId: 4 })).toEqual(
      [14, 15, 16, 17]
    );
    expect(
      getMemeApiSeasonIds({ seasonId: null, seasons, yearId: null })
    ).toEqual([]);
  });

  it("labels all-season actions by active year scope", () => {
    expect(getAllSeasonsLabel(null)).toBe("All Seasons");
    expect(getAllSeasonsLabel(0)).toBe("All Year 0 Seasons");
    expect(getAllSeasonsLabel(4)).toBe("All Year 4 Seasons");
  });
});
