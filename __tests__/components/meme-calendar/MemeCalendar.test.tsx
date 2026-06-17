import MemeCalendar from "@/components/meme-calendar/MemeCalendar";
import { fireEvent, render, screen, within } from "@testing-library/react";

jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => false,
}));

describe("MemeCalendar controls", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2026, 0, 1, 12)));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("exposes named zoom, guide, navigation, and jump controls", () => {
    render(<MemeCalendar displayTz="utc" locale="de-DE" />);

    const rangeGroup = screen.getByRole("group", { name: "Calendar range" });
    expect(
      within(rangeGroup).getByRole("button", { name: "SZN 14" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(rangeGroup).getByRole("button", { name: "Year 4" })
    ).toHaveAttribute("aria-pressed", "false");

    expect(
      screen.getByRole("button", { name: "Previous SZN" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next SZN" })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Show calendar guide" })
    );

    expect(
      screen.getByRole("button", { name: "Hide calendar guide" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Calendar guide" })
    ).toHaveTextContent("Minting Days");

    expect(screen.getByRole("button", { name: "Jump to Today" })).toBeEnabled();
    expect(screen.getByLabelText("Meme #")).toHaveAttribute("type", "number");
    expect(screen.getByLabelText("Date")).toHaveAttribute("type", "month");
  });

  it("formats default SZN grid dates and mint day labels with the active locale", () => {
    render(<MemeCalendar displayTz="utc" locale="de-DE" />);

    expect(screen.getByText("Januar 2026")).toBeInTheDocument();
    const mintButton = screen.getByRole("button", {
      name: /Fr\., 2\. Jan\. 2026: #439 mint/i,
    });
    expect(mintButton).toHaveAttribute(
      "data-tooltip-html",
      expect.stringContaining("Meme #439")
    );
    expect(mintButton).toHaveAttribute(
      "data-tooltip-html",
      expect.stringContaining("Fr., 2. Jan. 2026")
    );
  });

  it("names drilldown cards with titles, ranges, and mint counts", () => {
    render(<MemeCalendar displayTz="utc" locale="de-DE" />);

    const rangeGroup = screen.getByRole("group", { name: "Calendar range" });
    fireEvent.click(within(rangeGroup).getByRole("button", { name: "Year 4" }));

    expect(
      screen.getByRole("button", {
        name: /Open SZN #14: .+2026 - .+2026; Memes #/i,
      })
    ).toHaveTextContent("SZN #14");

    fireEvent.click(
      within(rangeGroup).getByRole("button", { name: "Epoch 1" })
    );

    expect(
      screen.getByRole("button", {
        name: /Open Year #4 \(2026\): .+2026 - .+2026; Memes #/i,
      })
    ).toHaveTextContent("Year #4 (2026)");
  });
});
