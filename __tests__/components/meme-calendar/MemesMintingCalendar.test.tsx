import MemesMintingCalendar from "@/components/meme-calendar/MemesMintingCalendar";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/meme-calendar/MemeCalendarOverview", () => ({
  __esModule: true,
  default: ({
    displayTz,
    locale,
    headerAction,
  }: {
    displayTz: string;
    locale: string;
    headerAction: React.ReactNode;
  }) => (
    <div data-locale={locale} data-testid="overview" data-tz={displayTz}>
      {headerAction}
    </div>
  ),
}));

jest.mock("@/components/meme-calendar/MemeCalendar", () => ({
  __esModule: true,
  default: ({ displayTz, locale }: { displayTz: string; locale: string }) => (
    <div data-locale={locale} data-testid="calendar" data-tz={displayTz} />
  ),
}));

describe("MemesMintingCalendar timezone toggle", () => {
  it("labels the timezone controls and passes locale to child views", async () => {
    render(<MemesMintingCalendar locale="de-DE" />);

    expect(
      screen.getByRole("tablist", { name: "Calendar timezone" })
    ).toBeInTheDocument();

    const localButton = screen.getByRole("tab", { name: "Local" });
    const utcButton = screen.getByRole("tab", { name: "UTC" });

    expect(localButton).toHaveAttribute("aria-selected", "true");
    expect(utcButton).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("overview")).toHaveAttribute(
      "data-locale",
      "de-DE"
    );
    expect(screen.getByTestId("calendar")).toHaveAttribute(
      "data-locale",
      "de-DE"
    );
    expect(screen.getByTestId("overview")).toHaveAttribute("data-tz", "local");

    await userEvent.click(utcButton);

    expect(localButton).toHaveAttribute("aria-selected", "false");
    expect(utcButton).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("overview")).toHaveAttribute("data-tz", "utc");
    expect(screen.getByTestId("calendar")).toHaveAttribute("data-tz", "utc");
  });
});
