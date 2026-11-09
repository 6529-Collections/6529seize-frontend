import { render } from "@testing-library/react";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import { mockDefaultTimeZone } from "../../../../utils/timeZoneHydration";
import {
  LOCAL_DISPLAY_TIME_ZONE,
  type DisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZone";

let mockDisplayTimeZone: DisplayTimeZone = LOCAL_DISPLAY_TIME_ZONE;
jest.mock("@/hooks/useDisplayTimeZone", () => ({
  ...jest.requireActual("@/hooks/useDisplayTimeZone"),
  useDisplayTimeZone: () => mockDisplayTimeZone,
}));

describe("WinnerDropBadge", () => {
  it("returns null when no rank or position", () => {
    const { container } = render(
      <WinnerDropBadge rank={null} position={0} decisionTime={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders rank text and date", () => {
    const time = Date.now();
    const toLocaleString = jest.spyOn(Date.prototype, "toLocaleString");
    toLocaleString.mockReturnValueOnce("Jan 1").mockReturnValueOnce("10:00 AM");
    const { getByText } = render(
      <WinnerDropBadge rank={2} position={1} decisionTime={time} />
    );
    expect(getByText("2nd")).toBeInTheDocument();
    expect(getByText("Jan 1")).toBeInTheDocument();
    expect(getByText(", 10:00 AM")).toBeInTheDocument();
    toLocaleString.mockRestore();
  });

  describe("display time zone", () => {
    // Friday 00:30 UTC is Thursday 16:30 in Los Angeles.
    const decisionTime = Date.UTC(2026, 0, 2, 0, 30);
    let restoreZone: () => void;

    beforeEach(() => {
      restoreZone = mockDefaultTimeZone("America/Los_Angeles");
    });

    afterEach(() => {
      restoreZone();
      mockDisplayTimeZone = LOCAL_DISPLAY_TIME_ZONE;
    });

    // The badge formats with the browser's default locale, so build each
    // expectation in the zone it should use rather than from literal text.
    const dateIn = (timeZone: string) =>
      new Date(decisionTime).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        timeZone,
      });
    // Testing Library collapses ICU's narrow no-break spaces to plain ones.
    const timeIn = (timeZone: string, timeZoneName?: "short") =>
      new Date(decisionTime)
        .toLocaleString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          timeZone,
          ...(timeZoneName ? { timeZoneName } : {}),
        })
        .replace(/\s/g, " ");

    it.each(["default", "simple"] as const)(
      "keeps the device-zone date and time when local (%s)",
      (variant) => {
        const { container, getByText } = render(
          <WinnerDropBadge
            rank={1}
            decisionTime={decisionTime}
            variant={variant}
          />
        );
        expect(container).toHaveTextContent(dateIn("America/Los_Angeles"));
        expect(
          getByText(`, ${timeIn("America/Los_Angeles")}`)
        ).toBeInTheDocument();
      }
    );

    it.each(["default", "simple"] as const)(
      "dates the win in the display zone and names it on the time (%s)",
      (variant) => {
        mockDisplayTimeZone = { timeZone: "UTC", isLocal: false };
        const { container, getByText } = render(
          <WinnerDropBadge
            rank={1}
            decisionTime={decisionTime}
            variant={variant}
          />
        );
        // The UTC day is a day later than the device's.
        expect(dateIn("UTC")).not.toBe(dateIn("America/Los_Angeles"));
        expect(container).toHaveTextContent(dateIn("UTC"));
        expect(container).not.toHaveTextContent(dateIn("America/Los_Angeles"));
        const time = getByText(`, ${timeIn("UTC", "short")}`);
        expect(time.textContent).toMatch(/UTC$/);
      }
    );
  });

  it("handles ordinal suffixes above third", () => {
    const { container } = render(
      <WinnerDropBadge rank={4} position={1} decisionTime={null} />
    );
    expect(container.textContent).toContain("4th");
  });
});
