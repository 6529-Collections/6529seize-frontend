import HomeWhatIs6529 from "@/components/home/newcomer/HomeWhatIs6529";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { render, screen, within } from "@testing-library/react";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: jest.fn(),
}));

it.each(["en-US", "en-GB", "fr-FR", "es-ES", "de-DE"] as const)(
  "keeps public destinations and English fallback available for %s",
  (locale) => {
    jest.mocked(useBrowserLocale).mockReturnValue(locale);
    render(<HomeWhatIs6529 />);
    const section = within(
      screen.getByRole("region", { name: "What is 6529?" })
    );
    for (const [name, href] of [
      ["Browse The Memes", "/the-memes"],
      ["Browse Waves", "/waves"],
      ["How voting works", "/network/tdh"],
    ] as const) {
      expect(section.getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(section.queryAllByRole("img")).toHaveLength(0);
  }
);
