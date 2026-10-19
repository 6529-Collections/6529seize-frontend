import {
  buildRowBases,
  buildTimeZoneRow,
  filterTimeZoneRows,
  getCityName,
  getRegionKey,
  sortTimeZoneRows,
  type TimeZoneRow,
} from "@/components/tools/time-zones/timeZoneRows";

function makeRow(
  overrides: Partial<TimeZoneRow> & Pick<TimeZoneRow, "id">
): TimeZoneRow {
  return {
    city: getCityName(overrides.id),
    regionKey: getRegionKey(overrides.id),
    mapZoneId: null,
    regionLabel: "Region",
    genericName: "Generic Time",
    offsetMinutes: 0,
    time: "12:00",
    date: "Thu, Jan 15",
    dst: "none",
    ...overrides,
  };
}

const ROWS: readonly TimeZoneRow[] = [
  makeRow({
    id: "Asia/Kolkata",
    regionLabel: "Asia",
    genericName: "India Standard Time",
    offsetMinutes: 330,
  }),
  makeRow({
    id: "Asia/Kathmandu",
    regionLabel: "Asia",
    genericName: "Nepal Time",
    offsetMinutes: 345,
  }),
  makeRow({
    id: "Asia/Karachi",
    regionLabel: "Asia",
    genericName: "Pakistan Time",
    offsetMinutes: 300,
  }),
  makeRow({
    id: "America/Sao_Paulo",
    regionLabel: "Americas",
    genericName: "Brasília Time",
    offsetMinutes: -180,
  }),
  makeRow({
    id: "Europe/London",
    regionLabel: "Europe",
    genericName: "United Kingdom Time",
    offsetMinutes: 0,
    dst: "standard",
  }),
  makeRow({
    id: "Australia/Lord_Howe",
    regionLabel: "Australia",
    genericName: "Lord Howe Time",
    offsetMinutes: 660,
    dst: "daylight",
  }),
];

const ids = (rows: readonly { readonly id: string }[]) =>
  rows.map((row) => row.id);

describe("zone naming", () => {
  it("derives the city and region from the IANA ID", () => {
    expect(getCityName("America/Argentina/Buenos_Aires")).toBe("Buenos Aires");
    expect(getRegionKey("America/Argentina/Buenos_Aires")).toBe("america");
    expect(getRegionKey("Indian/Maldives")).toBe("indian");
    expect(getRegionKey("UTC")).toBe("other");
  });

  it("lists mapped zones, then browser zones that are not the same zone", () => {
    const bases = buildRowBases(
      [
        { tzid: "Asia/Kolkata", x: 1400, y: 380 },
        { tzid: "Europe/Brussels", x: 1010, y: 210 },
      ],
      // A legacy name for a mapped zone, a tzdata alias, an Etc zone and an
      // exact duplicate.
      ["Asia/Calcutta", "Europe/Amsterdam", "Etc/GMT-3", "Europe/Brussels"]
    );
    expect(bases).toEqual([
      {
        id: "Asia/Kolkata",
        city: "Kolkata",
        regionKey: "asia",
        mapZoneId: "Asia/Kolkata",
      },
      {
        id: "Europe/Brussels",
        city: "Brussels",
        regionKey: "europe",
        mapZoneId: "Europe/Brussels",
      },
      {
        id: "Europe/Amsterdam",
        city: "Amsterdam",
        regionKey: "europe",
        mapZoneId: null,
      },
      {
        id: "Etc/GMT-3",
        city: "GMT-3",
        regionKey: "other",
        mapZoneId: null,
      },
    ]);
  });

  it("uses the browser's list when there is no map data", () => {
    expect(ids(buildRowBases([], ["Asia/Tokyo", "UTC"]))).toEqual([
      "Asia/Tokyo",
      "UTC",
    ]);
  });

  it("skips zones the browser does not know", () => {
    const date = new Date(Date.UTC(2026, 0, 15, 12));
    expect(
      buildTimeZoneRow(
        {
          id: "Mars/Olympus_Mons",
          city: "Olympus Mons",
          regionKey: "other",
          mapZoneId: null,
        },
        "en-US",
        date,
        "Other"
      )
    ).toBeNull();
    expect(
      buildTimeZoneRow(
        {
          id: "Asia/Kolkata",
          city: "Kolkata",
          regionKey: "asia",
          mapZoneId: null,
        },
        "en-GB",
        date,
        "Asia"
      )
    ).toMatchObject({ offsetMinutes: 330, time: "17:30", dst: "none" });
  });
});

describe("filterTimeZoneRows", () => {
  it("returns every row for an empty query", () => {
    expect(filterTimeZoneRows(ROWS, "   ")).toBe(ROWS);
  });

  it("matches city, ID, region and localized names without accents", () => {
    expect(ids(filterTimeZoneRows(ROWS, "sao paulo"))).toEqual([
      "America/Sao_Paulo",
    ]);
    expect(ids(filterTimeZoneRows(ROWS, "brasilia"))).toEqual([
      "America/Sao_Paulo",
    ]);
    expect(ids(filterTimeZoneRows(ROWS, "lord_howe"))).toEqual([
      "Australia/Lord_Howe",
    ]);
    expect(ids(filterTimeZoneRows(ROWS, "asia time"))).toEqual([
      "Asia/Kolkata",
      "Asia/Kathmandu",
      "Asia/Karachi",
    ]);
  });

  it("matches offsets numerically", () => {
    expect(ids(filterTimeZoneRows(ROWS, "+5:30"))).toEqual(["Asia/Kolkata"]);
    expect(ids(filterTimeZoneRows(ROWS, "UTC+5"))).toEqual([
      "Asia/Kolkata",
      "Asia/Kathmandu",
      "Asia/Karachi",
    ]);
    expect(ids(filterTimeZoneRows(ROWS, "gmt-03:00"))).toEqual([
      "America/Sao_Paulo",
    ]);
    expect(ids(filterTimeZoneRows(ROWS, "−3"))).toEqual(["America/Sao_Paulo"]);
    expect(ids(filterTimeZoneRows(ROWS, "utc"))).toEqual(["Europe/London"]);
  });
});

describe("sortTimeZoneRows", () => {
  it("sorts by offset west to east, then by city", () => {
    expect(ids(sortTimeZoneRows(ROWS, "offset", "ascending", "en-US"))).toEqual(
      [
        "America/Sao_Paulo",
        "Europe/London",
        "Asia/Karachi",
        "Asia/Kolkata",
        "Asia/Kathmandu",
        "Australia/Lord_Howe",
      ]
    );
    expect(
      ids(sortTimeZoneRows(ROWS, "offset", "descending", "en-US"))[0]
    ).toBe("Australia/Lord_Howe");
  });

  it("sorts by city with the locale collator", () => {
    expect(ids(sortTimeZoneRows(ROWS, "zone", "ascending", "en-US"))).toEqual([
      "Asia/Karachi",
      "Asia/Kathmandu",
      "Asia/Kolkata",
      "Europe/London",
      "Australia/Lord_Howe",
      "America/Sao_Paulo",
    ]);
  });

  it("sorts by region label, then by city", () => {
    expect(
      ids(sortTimeZoneRows(ROWS, "region", "ascending", "en-US")).slice(0, 2)
    ).toEqual(["America/Sao_Paulo", "Asia/Karachi"]);
  });

  it("does not mutate the input", () => {
    const before = ids(ROWS);
    sortTimeZoneRows(ROWS, "zone", "descending", "de-DE");
    expect(ids(ROWS)).toEqual(before);
  });
});
