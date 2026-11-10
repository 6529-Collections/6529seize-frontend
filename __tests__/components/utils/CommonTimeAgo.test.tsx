import { act, render, screen } from "@testing-library/react";
import CommonTimeAgo from "@/components/utils/CommonTimeAgo";
import {
  resetDisplayTimeZoneSnapshotForTests,
  setDisplayTimeZoneOverride,
} from "@/lib/display-time-zone/displayTimeZoneStore";

jest.mock("@/helpers/Helpers", () => ({
  getTimeAgo: jest.fn(),
  getTimeAgoShort: jest.fn(),
}));

const helpers = jest.requireMock("../../../helpers/Helpers");

describe("CommonTimeAgo", () => {
  let toLocaleStringSpy: jest.SpyInstance<
    string,
    Parameters<typeof Date.prototype.toLocaleString>
  >;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    toLocaleStringSpy = jest
      .spyOn(Date.prototype, "toLocaleString")
      .mockReturnValue("human readable");
  });

  afterEach(() => {
    act(() => setDisplayTimeZoneOverride(null));
    resetDisplayTimeZoneSnapshotForTests();
    globalThis.sessionStorage.clear();
    jest.clearAllTimers();
    jest.useRealTimers();
    toLocaleStringSpy.mockRestore();
  });

  it("uses long format by default", () => {
    const timestamp = 1_700_000_000_000;
    helpers.getTimeAgo.mockReturnValue("long");

    render(<CommonTimeAgo timestamp={timestamp} />);

    expect(helpers.getTimeAgo).toHaveBeenCalledWith(timestamp);

    const time = screen.getByText("long");
    const isoTimestamp = new Date(timestamp).toISOString();

    expect(time.tagName).toBe("TIME");
    expect(time).toHaveClass(
      "tw-whitespace-nowrap tw-font-normal tw-text-iron-500 tw-text-sm sm:tw-text-base"
    );
    expect(time).toHaveAttribute("dateTime", isoTimestamp);
    expect(time).toHaveAttribute("title", "human readable");
  });

  it("uses short format when short prop set", () => {
    const timestamp = 1_800_000_000_000;
    helpers.getTimeAgoShort.mockReturnValue("short");

    render(<CommonTimeAgo timestamp={timestamp} short className="extra" />);

    expect(helpers.getTimeAgoShort).toHaveBeenCalledWith(timestamp);
    const time = screen.getByText("short");
    const isoTimestamp = new Date(timestamp).toISOString();

    expect(time).toHaveClass(
      "tw-whitespace-nowrap tw-font-normal tw-text-iron-500 extra"
    );
    expect(time).toHaveAttribute("dateTime", isoTimestamp);
    expect(time).toHaveAttribute("title", "human readable");
  });

  it("refreshes the displayed value every minute", () => {
    const timestamp = Date.now();
    helpers.getTimeAgo
      .mockReturnValueOnce("initial")
      .mockReturnValue("updated");

    render(<CommonTimeAgo timestamp={timestamp} />);

    expect(screen.getByText("initial")).toBeInTheDocument();
    expect(helpers.getTimeAgo).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(helpers.getTimeAgo).toHaveBeenCalledTimes(2);
    expect(screen.getByText("updated")).toBeInTheDocument();
  });

  it("formats the hover title in the display zone", () => {
    const timestamp = 1_700_000_000_000;
    helpers.getTimeAgo.mockReturnValue("long");
    // Jest runs in UTC, so another zone stands in for "not the device zone".
    act(() => setDisplayTimeZoneOverride("Asia/Tokyo"));

    render(<CommonTimeAgo timestamp={timestamp} />);

    expect(toLocaleStringSpy).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        timeZone: "Asia/Tokyo",
        timeZoneName: "short",
      })
    );
  });
});
