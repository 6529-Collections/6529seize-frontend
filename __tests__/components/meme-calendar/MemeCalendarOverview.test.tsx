import MemeCalendarOverview from "@/components/meme-calendar/MemeCalendarOverview";
import {
  getRangeDatesByZoom,
  getSeasonIndexForDate,
  nextMintDateOnOrAfter,
} from "@/components/meme-calendar/meme-calendar.helpers";
import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";

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

describe("MemeCalendarOverview upcoming mints card", () => {
  const DIVISION_DATE_FORMAT = {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  } satisfies Intl.DateTimeFormatOptions;

  const formatDivisionDate = (date: Date, locale: string): string =>
    new Intl.DateTimeFormat(locale, DIVISION_DATE_FORMAT).format(date);

  const getSznDivisionRange = (date: Date, locale: string): string => {
    const nextMintDate = nextMintDateOnOrAfter(date);
    const { start, end } = getRangeDatesByZoom(
      "szn",
      getSeasonIndexForDate(nextMintDate)
    );

    return `${formatDivisionDate(start, locale)} - ${formatDivisionDate(
      end,
      locale
    )}`;
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps the heading in SSR and starts browser clocks without hydration mismatches", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-15T23:59:59Z"));
    const element = <MemeCalendarOverview displayTz="local" locale="de-DE" />;
    const html = renderToString(element);
    expect(html).toContain("The Memes Minting Calendar");
    expect(html).not.toContain("<table");
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = html;
    jest.setSystemTime(new Date("2026-09-16T00:01:30Z"));
    const onRecoverableError = jest.fn();
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, element, { onRecoverableError });
    });
    expect(container.querySelector("table")).not.toBeNull();
    expect(onRecoverableError).not.toHaveBeenCalled();
    act(() => root!.unmount());
    container.remove();
  });

  it("shows next season when current season has no upcoming mints", () => {
    jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2025, 11, 31)));
    render(<MemeCalendarOverview displayTz="utc" />);
    expect(
      screen.getByRole("table", { name: /Upcoming Mints for SZN 14/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/No upcoming mints in this season./)
    ).not.toBeInTheDocument();
  });

  it("uses locale-aware overview labels and preserves locale on the full calendar link", () => {
    const now = new Date(Date.UTC(2025, 11, 31));
    jest.useFakeTimers().setSystemTime(now);
    render(<MemeCalendarOverview displayTz="utc" locale="de-DE" showViewAll />);

    expect(
      screen.getByRole("heading", { name: "The Memes Minting Calendar" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View full Memes minting calendar" })
    ).toHaveAttribute("href", "/meme-calendar?locale=de-DE");
    expect(
      screen.getByRole("button", { name: "Next Mint" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Meme #")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Add to Calendar" }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "Add to Google Calendar" }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("columnheader", { name: "Meme number" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Mint time" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Calendar links" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(getSznDivisionRange(now, "de-DE"))
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Screenshot" })).toHaveClass(
      "focus-visible:tw-outline"
    );
  });
});
