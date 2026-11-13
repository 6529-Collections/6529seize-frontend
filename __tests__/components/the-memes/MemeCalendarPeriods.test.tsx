import MemeCalendarPeriods from "@/components/the-memes/MemeCalendarPeriods";
import { render, screen } from "@testing-library/react";

describe("MemeCalendarPeriods", () => {
  it("keeps linked year and season styles aligned across breakpoints", () => {
    const yearHref = "/the-memes?year=4&sort=age&sort_dir=ASC";

    render(
      <MemeCalendarPeriods
        id={516}
        seasonHref="/the-memes?szn=16&sort=age&sort_dir=ASC"
        yearHref={yearHref}
      />
    );

    const seasonLink = screen.getByRole("link", {
      name: "View SZN 16 cards",
    });
    const yearLink = screen.getByRole("link", {
      name: "View Year 4 cards",
    });
    expect(yearLink).toHaveAttribute("href", yearHref);

    for (const className of [
      "tw-border",
      "tw-border-iron-700",
      "tw-bg-iron-900",
      "tw-px-2.5",
      "tw-text-iron-100",
      "md:tw-border-0",
      "md:tw-bg-transparent",
      "md:tw-px-0",
    ]) {
      expect(seasonLink).toHaveClass(className);
      expect(yearLink).toHaveClass(className);
    }
  });
});
