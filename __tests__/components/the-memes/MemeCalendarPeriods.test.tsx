import MemeCalendarPeriods from "@/components/the-memes/MemeCalendarPeriods";
import { render, screen } from "@testing-library/react";

describe("MemeCalendarPeriods", () => {
  it("styles linked year like the linked season chip", () => {
    render(
      <MemeCalendarPeriods
        id={516}
        seasonHref="/the-memes?szn=16&sort=age&sort_dir=ASC"
        yearHref="/the-memes?year=4&sort=age&sort_dir=ASC"
      />
    );

    const seasonLink = screen.getByRole("link", {
      name: "View SZN 16 cards",
    });
    const yearLink = screen.getByRole("link", {
      name: "View Year 4 cards",
    });

    for (const className of [
      "tw-border",
      "tw-border-iron-700",
      "tw-bg-iron-900",
      "tw-px-2.5",
      "tw-text-iron-100",
    ]) {
      expect(seasonLink).toHaveClass(className);
      expect(yearLink).toHaveClass(className);
    }
  });
});
