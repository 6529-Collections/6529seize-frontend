import {
  isValidWaveSearchDateRange,
  parseLocalDateStart,
} from "@/components/waves/drops/search/waveDropsSearch.utils";

describe("waveDropsSearch date helpers", () => {
  it("rejects impossible calendar dates", () => {
    expect(parseLocalDateStart("2026-02-30")).toBeUndefined();
    expect(parseLocalDateStart("not-a-date")).toBeUndefined();
  });

  it("uses local midnight and accepts an ordered range", () => {
    const timestamp = parseLocalDateStart("2026-08-20");
    expect(timestamp).toBe(new Date(2026, 7, 20).getTime());
    expect(isValidWaveSearchDateRange("2026-08-19", "2026-08-20")).toBe(true);
  });

  it("rejects equal and inverted boundaries", () => {
    expect(isValidWaveSearchDateRange("2026-08-20", "2026-08-20")).toBe(false);
    expect(isValidWaveSearchDateRange("2026-08-21", "2026-08-20")).toBe(false);
  });
});
