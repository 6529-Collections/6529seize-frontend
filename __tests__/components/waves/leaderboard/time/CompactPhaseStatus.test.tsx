import { render } from "@testing-library/react";
import { CompactPhaseStatus } from "@/components/waves/leaderboard/time/CompactPhaseStatus";
import {
  LOCAL_DISPLAY_TIME_ZONE,
  type DisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZone";
import { mockDefaultTimeZone } from "../../../../utils/timeZoneHydration";

let mockDisplayTimeZone: DisplayTimeZone = LOCAL_DISPLAY_TIME_ZONE;
jest.mock("@/hooks/useDisplayTimeZone", () => ({
  ...jest.requireActual("@/hooks/useDisplayTimeZone"),
  useDisplayTimeZone: () => mockDisplayTimeZone,
}));

// Friday 00:30 UTC is still Thursday afternoon in Los Angeles.
const DEADLINE = Date.UTC(2026, 0, 2, 0, 30);

function getTime(): HTMLElement {
  const time = document.querySelector("time");
  if (!(time instanceof HTMLElement)) {
    throw new Error("No <time> element rendered");
  }
  return time;
}

describe("CompactPhaseStatus display time zone", () => {
  let restoreZone: (() => void) | null = null;

  beforeEach(() => {
    mockDisplayTimeZone = LOCAL_DISPLAY_TIME_ZONE;
  });

  afterEach(() => {
    restoreZone?.();
    restoreZone = null;
  });

  it("keeps the device-zone date and full date unchanged when local", () => {
    restoreZone = mockDefaultTimeZone("America/Los_Angeles");
    render(
      <CompactPhaseStatus
        labelKey="waves.leaderboard.timeline.paused"
        timestamp={DEADLINE}
      />
    );
    const time = getTime();
    expect(time).toHaveTextContent(/^Jan 1, 2026$/);
    expect(time).toHaveAttribute(
      "title",
      expect.stringMatching(/^Thursday, January 1, 2026 at 4:30:00\sPM PST$/)
    );
    expect(time).toHaveAttribute("datetime", "2026-01-02T00:30:00.000Z");
  });

  it("shows the date and full time in the display zone, named", () => {
    restoreZone = mockDefaultTimeZone("America/Los_Angeles");
    mockDisplayTimeZone = { timeZone: "UTC", isLocal: false };
    render(
      <CompactPhaseStatus
        labelKey="waves.leaderboard.timeline.paused"
        timestamp={DEADLINE}
      />
    );
    const time = getTime();
    // The day flips at the display zone's midnight, not the device's.
    expect(time).toHaveTextContent(/^Jan 2, 2026$/);
    expect(time).toHaveAttribute(
      "title",
      expect.stringMatching(/^Friday, January 2, 2026 at 12:30:00\sAM UTC$/)
    );
    expect(time).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/12:30:00\sAM UTC$/)
    );
  });

  it("names an offset zone in the full date", () => {
    mockDisplayTimeZone = { timeZone: "Asia/Dubai", isLocal: false };
    render(
      <CompactPhaseStatus
        labelKey="waves.leaderboard.timeline.paused"
        timestamp={Date.UTC(2026, 0, 1, 23, 59)}
      />
    );
    const time = getTime();
    expect(time).toHaveTextContent(/^Jan 2, 2026$/);
    expect(time).toHaveAttribute(
      "title",
      expect.stringMatching(/^Friday, January 2, 2026 at 3:59:00\sAM GMT\+4$/)
    );
  });
});
