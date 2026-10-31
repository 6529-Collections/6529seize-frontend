import MemeLabPage from "@/app/meme-lab/page";
import MemesMintingCalendarPage from "@/app/meme-calendar/page";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/memelab/MemeLab", () => ({
  __esModule: true,
  default: () => <div data-testid="meme-lab" />,
}));

jest.mock("@/components/meme-calendar/MemesMintingCalendar", () => ({
  __esModule: true,
  default: () => <div data-testid="meme-calendar" />,
}));

jest.mock("@/lib/structured-data/json-ld", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/config/env", () => ({
  publicEnv: {
    BASE_ENDPOINT: "https://6529.io",
  },
}));

// The server renders a route's content in the `?locale=` it was asked for (the
// default when absent), while the document language follows the browser. The
// route content has to name its own language (WCAG 3.1.2).
describe("route content language", () => {
  it.each([
    [{ locale: "de-DE" }, "de-DE"],
    [{ locale: "DE-de" }, "de-DE"],
    [{}, "en-US"],
    [{ locale: "unsupported-LC" }, "en-US"],
  ])("labels the Meme Lab list for search params %j", async (params, lang) => {
    const page = await MemeLabPage({ searchParams: Promise.resolve(params) });

    render(page);

    expect(screen.getByRole("main")).toHaveAttribute("lang", lang);
    expect(screen.getByTestId("meme-lab")).toBeInTheDocument();
  });

  it.each([
    [{ locale: "fr-FR" }, "fr-FR"],
    [{}, "en-US"],
    [{ locale: "unsupported-LC" }, "en-US"],
  ])(
    "labels the minting calendar for search params %j",
    async (params, lang) => {
      const page = await MemesMintingCalendarPage({
        searchParams: Promise.resolve(params),
      });

      const { container } = render(page);

      expect(container.firstElementChild).toHaveAttribute("lang", lang);
      expect(screen.getByTestId("meme-calendar")).toBeInTheDocument();
    }
  );
});
