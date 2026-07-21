import {
  getTimeAgo,
  getTimeAgoShort,
  getTimeUntil,
} from "@/helpers/timeDisplayHelpers";

describe("timeDisplayHelpers", () => {
  const now = Date.UTC(2026, 6, 21, 12);

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("preserves long relative-time output", () => {
    expect(getTimeAgo(now - 2 * 60 * 60 * 1000)).toBe("2 hours ago");
    expect(getTimeAgo(now - 30 * 1000)).toBe("Just now");
  });

  it("preserves short relative-time output", () => {
    expect(getTimeAgoShort(now - 5 * 60 * 1000, now)).toBe("5m");
    expect(getTimeAgoShort(now - 3 * 24 * 60 * 60 * 1000, now, true)).toBe(
      "3d"
    );
  });

  it("preserves getTimeUntil leading and trailing spaces", () => {
    expect(getTimeUntil(now + 60 * 60 * 1000)).toBe("in 1 hour ");
    expect(getTimeUntil(now - 60 * 60 * 1000)).toBe(" 1 hour ago");
  });
});
