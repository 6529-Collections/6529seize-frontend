import {
  formatSubmissionWindowTime,
  getMemesHeaderDropActionState,
} from "@/components/brain/my-stream/waveDropAction.helpers";
import { SubmissionStatus } from "@/hooks/useWave";
import { LOCAL_DISPLAY_TIME_ZONE } from "@/lib/display-time-zone/displayTimeZone";
import { mockDefaultTimeZone } from "../../../utils/timeZoneHydration";

// Friday 00:30 UTC is Thursday 16:30 in Los Angeles.
const BOUNDARY = Date.UTC(2026, 0, 2, 0, 30, 15);
const UTC_ZONE = { timeZone: "UTC", isLocal: false } as const;

const DATE_TIME_FIELDS = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
} as const;

const participation = (
  status: SubmissionStatus
): Parameters<
  typeof getMemesHeaderDropActionState
>[0]["participationState"] => ({
  canSubmitNow: false,
  endTime: BOUNDARY,
  hasReachedLimit: false,
  isEligible: true,
  maxSubmissions: null,
  startTime: BOUNDARY,
  status,
});

describe("formatSubmissionWindowTime", () => {
  let restoreZone: (() => void) | null = null;

  afterEach(() => {
    restoreZone?.();
    restoreZone = null;
  });

  it("matches Date#toLocaleString() in the device zone", () => {
    restoreZone = mockDefaultTimeZone("America/Los_Angeles");
    for (const value of [BOUNDARY, Date.UTC(2026, 6, 4, 12), 0]) {
      expect(formatSubmissionWindowTime(value)).toBe(
        new Date(value).toLocaleString()
      );
      expect(formatSubmissionWindowTime(value, LOCAL_DISPLAY_TIME_ZONE)).toBe(
        new Date(value).toLocaleString()
      );
    }
  });

  it("writes the time in the display zone and names it", () => {
    restoreZone = mockDefaultTimeZone("America/Los_Angeles");
    const formatted = formatSubmissionWindowTime(BOUNDARY, UTC_ZONE);
    expect(formatted).toBe(
      new Date(BOUNDARY).toLocaleString(undefined, {
        ...DATE_TIME_FIELDS,
        timeZone: "UTC",
        timeZoneName: "short",
      })
    );
    expect(formatted).toMatch(/UTC$/);
    // The day is the UTC one, not the device's earlier day.
    expect(formatted).toContain(
      new Date(BOUNDARY).toLocaleDateString(undefined, { timeZone: "UTC" })
    );
    expect(formatted).not.toContain(
      new Date(BOUNDARY).toLocaleDateString(undefined, {
        timeZone: "America/Los_Angeles",
      })
    );
  });
});

describe("getMemesHeaderDropActionState submission window times", () => {
  it.each([
    [SubmissionStatus.ENDED, "Submissions closed on "],
    [SubmissionStatus.NOT_STARTED, "Submissions open on "],
  ])("keeps the device-zone message for %s", (status, prefix) => {
    const state = getMemesHeaderDropActionState({
      participationState: participation(status),
      isApprovalVotingControlsLocked: false,
    });
    expect(state.restrictionMessage).toBe(
      `${prefix}${new Date(BOUNDARY).toLocaleString()}`
    );
  });

  it.each([
    [SubmissionStatus.ENDED, "Submissions closed on "],
    [SubmissionStatus.NOT_STARTED, "Submissions open on "],
  ])("uses the display zone for %s", (status, prefix) => {
    const state = getMemesHeaderDropActionState({
      participationState: participation(status),
      isApprovalVotingControlsLocked: false,
      zone: { timeZone: "Asia/Dubai", isLocal: false },
    });
    expect(state.restrictionMessage).toBe(
      `${prefix}${formatSubmissionWindowTime(BOUNDARY, {
        timeZone: "Asia/Dubai",
        isLocal: false,
      })}`
    );
    expect(state.restrictionMessage).toMatch(/GMT\+4$/);
  });
});
