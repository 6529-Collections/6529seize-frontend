import MemeCalendar from "@/components/meme-calendar/MemeCalendar";
import MemesMintingCalendar from "@/components/meme-calendar/MemesMintingCalendar";
import {
  getMintNumberForMintDate,
  type DisplayTz,
} from "@/components/meme-calendar/meme-calendar.helpers";
import { act, fireEvent, render, screen } from "@testing-library/react";

import {
  mockDefaultTimeZone,
  renderServerThenHydrate,
} from "../../utils/timeZoneHydration";

jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock("@/hooks/usePublishedMemes", () => ({
  __esModule: true,
  default: () => ({ publishedMemeIds: new Set<number>(), status: "ready" }),
}));

jest.mock("@/components/meme-calendar/MemeCalendarOverview", () => ({
  __esModule: true,
  default: () => null,
}));

const LOS_ANGELES = "America/Los_Angeles";
const AUCKLAND = "Pacific/Auckland";
const KIRITIMATI = "Pacific/Kiritimati";

// Meme #440 is scheduled on Monday 5 Jan 2026 (UTC) and starts at 15:40 UTC:
// still 5 Jan in Los Angeles, but 6 Jan in Auckland and Kiritimati.
const MON_JAN_5 = "Mon, Jan 5, 2026";
const TUE_JAN_6 = "Tue, Jan 6, 2026";
const mintCellName = (date: string) => `${date}: #440 mint`;

let restoreTimeZone: (() => void) | undefined;

function viewInZone(zone: string, now: string) {
  jest.useFakeTimers().setSystemTime(new Date(now));
  restoreTimeZone = mockDefaultTimeZone(zone);
}

function calendar(displayTz: DisplayTz) {
  return (
    <MemeCalendar
      displayTz={displayTz}
      locale="en-US"
      publishedMemeIds={new Set<number>()}
      publishedMemesStatus="ready"
    />
  );
}

function getTodayCell(container: HTMLElement): Element {
  const todayCells = container.querySelectorAll('[aria-current="date"]');
  expect(todayCells).toHaveLength(1);
  return todayCells[0]!;
}

afterEach(() => {
  restoreTimeZone?.();
  restoreTimeZone = undefined;
  jest.useRealTimers();
});

describe("MemeCalendar grid in local mode", () => {
  it.each([
    ["UTC", MON_JAN_5, TUE_JAN_6],
    [LOS_ANGELES, MON_JAN_5, TUE_JAN_6],
    [AUCKLAND, TUE_JAN_6, MON_JAN_5],
    [KIRITIMATI, TUE_JAN_6, MON_JAN_5],
  ])(
    "places Meme #440 on its local start date in %s",
    (zone, localDate, otherDate) => {
      viewInZone(zone, "2026-01-05T12:00:00.000Z");
      render(calendar("local"));

      const mintCell = screen.getByRole("button", {
        name: mintCellName(localDate),
      });
      expect(
        screen.queryByRole("button", { name: mintCellName(otherDate) })
      ).not.toBeInTheDocument();
      // The cell and its tooltip show the same local date.
      expect(mintCell).toHaveAttribute(
        "data-tooltip-html",
        expect.stringContaining(localDate)
      );
    }
  );

  it.each([
    // 18:00 on Mon 5 Jan in Los Angeles; already Tue 6 Jan in UTC.
    [LOS_ANGELES, "2026-01-06T02:00:00.000Z", mintCellName(MON_JAN_5)],
    ["UTC", "2026-01-06T02:00:00.000Z", TUE_JAN_6],
    // 01:00 on Tue 6 Jan in Auckland and Kiritimati; still Mon 5 Jan in UTC.
    [AUCKLAND, "2026-01-05T12:00:00.000Z", mintCellName(TUE_JAN_6)],
    [KIRITIMATI, "2026-01-05T11:00:00.000Z", mintCellName(TUE_JAN_6)],
    ["UTC", "2026-01-05T11:00:00.000Z", mintCellName(MON_JAN_5)],
  ])("highlights today's %s date at %s", (zone, now, expectedToday) => {
    viewInZone(zone, now);
    const { container } = render(calendar("local"));

    const todayCell = getTodayCell(container);
    expect(
      todayCell.getAttribute("aria-label") ?? todayCell.textContent
    ).toContain(expectedToday);
  });

  it("opens the season that holds the viewer's today", () => {
    // 01:00 on 1 Apr in Auckland is still 31 Mar in UTC.
    viewInZone(AUCKLAND, "2026-03-31T12:00:00.000Z");
    render(calendar("local"));

    expect(screen.getByText("April 2026")).toBeInTheDocument();
    expect(screen.queryByText("March 2026")).not.toBeInTheDocument();
  });

  describe("Find mint date", () => {
    const scrollIntoView = jest.fn();

    beforeEach(() => {
      scrollIntoView.mockClear();
      Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
        configurable: true,
        value: scrollIntoView,
      });
    });

    afterEach(() => {
      Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    });

    it("opens the cell and season of the mint's local date", () => {
      // Wed 30 Sep 2026 (UTC) starts at 03:40 on Thu 1 Oct in Auckland.
      const mintNumber = getMintNumberForMintDate(
        new Date(Date.UTC(2026, 8, 30))
      );
      viewInZone(AUCKLAND, "2026-09-01T12:00:00.000Z");
      render(calendar("local"));

      fireEvent.change(screen.getByLabelText("Meme #"), {
        target: { value: String(mintNumber) },
      });
      fireEvent.click(screen.getByRole("button", { name: "Find mint date" }));
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(screen.getByText("October 2026")).toBeInTheDocument();
      // Each month of the season looks the cell up by id; all find this one.
      expect(scrollIntoView).toHaveBeenCalled();
      for (const element of scrollIntoView.mock.contexts) {
        expect(element).toHaveAttribute("id", "meme-cell-20261001");
      }
    });
  });
});

describe("MemeCalendar grid in UTC mode", () => {
  it("keeps UTC dates for a viewer in Auckland", () => {
    viewInZone(AUCKLAND, "2026-01-05T12:00:00.000Z");
    const { container } = render(calendar("utc"));

    expect(
      screen.getByRole("button", { name: mintCellName(MON_JAN_5) })
    ).toHaveAttribute(
      "data-tooltip-html",
      expect.stringContaining(`${MON_JAN_5}, 15:40 UTC`)
    );
    expect(
      screen.queryByRole("button", { name: mintCellName(TUE_JAN_6) })
    ).not.toBeInTheDocument();
    expect(getTodayCell(container)).toHaveAttribute(
      "aria-label",
      mintCellName(MON_JAN_5)
    );
  });
});

describe("MemeCalendar guide minting days", () => {
  const openGuide = () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Show calendar guide" })
    );
    return screen.getByRole("region", { name: "Calendar guide" });
  };

  it.each([
    ["UTC", "Mon, Wed, Fri"],
    [LOS_ANGELES, "Mon, Wed, Fri"],
    [AUCKLAND, "Tue, Thu, Sat"],
    [KIRITIMATI, "Tue, Thu, Sat"],
  ])("adds the %s weekdays in local mode", (zone, localDays) => {
    viewInZone(zone, "2026-01-05T12:00:00.000Z");
    render(calendar("local"));

    expect(openGuide()).toHaveTextContent(
      `Minting DaysMonday / Wednesday / Friday (UTC) In your time zone: ${localDays}`
    );
  });

  it("states the UTC schedule only in UTC mode", () => {
    viewInZone(AUCKLAND, "2026-01-05T12:00:00.000Z");
    render(calendar("utc"));

    const guide = openGuide();
    expect(guide).toHaveTextContent("Monday / Wednesday / Friday (UTC)");
    expect(guide).not.toHaveTextContent("In your time zone");
  });
});

describe("Minting calendar page hydration", () => {
  it("keeps the grid out of server HTML and shows the viewer's dates after hydration", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-05T12:00:00.000Z"));
    const result = await renderServerThenHydrate(
      <MemesMintingCalendar locale="en-US" />,
      { serverTimeZone: "UTC", clientTimeZone: AUCKLAND }
    );

    try {
      expect(result.recoverableErrors).toEqual([]);
      expect(result.hydrationConsoleErrors).toEqual([]);
      expect(result.serverHtml).not.toContain("meme-cell-");
      expect(
        result.container.querySelector("#meme-cell-20260106")
      ).toHaveAttribute("aria-label", mintCellName(TUE_JAN_6));
      expect(result.container.querySelector("#meme-cell-20260105")).toBeNull();
    } finally {
      await result.cleanup();
    }
  });
});
