import MemeCalendarOverview from "@/components/meme-calendar/MemeCalendarOverview";
import type { DisplayTz } from "@/components/meme-calendar/meme-calendar.helpers";
import { render, screen } from "@testing-library/react";

import { mockDefaultTimeZone } from "../../utils/timeZoneHydration";

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({
    isCapacitor: false,
    platform: "web",
    isIos: false,
    isAndroid: false,
    orientation: 0,
    keyboardVisible: false,
    isActive: false,
  }),
}));

// SZN 14 runs from 1 Jan to 31 Mar 2026. Its bounds are calendar dates, so
// every viewer sees the same first and last day; west of UTC the old local
// formatting showed 31 Dec 2025 - 30 Mar 2026.
const SZN_14_RANGE = "Thu, Jan 1, 2026 - Tue, Mar 31, 2026";

let restoreTimeZone: (() => void) | undefined;

afterEach(() => {
  restoreTimeZone?.();
  restoreTimeZone = undefined;
  jest.useRealTimers();
});

describe("MemeCalendarOverview upcoming season range", () => {
  it.each<[string, DisplayTz]>([
    ["America/Los_Angeles", "local"],
    ["Pacific/Auckland", "local"],
    ["UTC", "local"],
    ["America/Los_Angeles", "utc"],
  ])("shows the SZN 14 calendar dates in %s (%s mode)", (zone, displayTz) => {
    jest.useFakeTimers().setSystemTime(new Date("2026-02-10T12:00:00.000Z"));
    restoreTimeZone = mockDefaultTimeZone(zone);
    render(<MemeCalendarOverview displayTz={displayTz} locale="en-US" />);

    expect(
      screen.getByRole("table", { name: "Upcoming Mints for SZN 14" })
    ).toBeInTheDocument();
    expect(screen.getByText(SZN_14_RANGE)).toBeInTheDocument();
  });
});
