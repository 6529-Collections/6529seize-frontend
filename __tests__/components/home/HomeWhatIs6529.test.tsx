import { getHomepageClick } from "@/components/home/homepageTracking";
import HomeWhatIs6529 from "@/components/home/newcomer/HomeWhatIs6529";
import HomeWhatIsNetworkState from "@/components/home/newcomer/what-is/HomeWhatIsNetworkState";
import HomeWhatIsPeopleAndAgents from "@/components/home/newcomer/what-is/HomeWhatIsPeopleAndAgents";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { render, screen, within } from "@testing-library/react";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: jest.fn(),
}));

const MAIN_STAGE = "/waves/b6128077-ea78-4dd9-b381-52c4eadb2077";

it.each(["en-US", "en-GB", "fr-FR", "es-ES", "de-DE"] as const)(
  "keeps public destinations and English fallback available for %s",
  (locale) => {
    jest.mocked(useBrowserLocale).mockReturnValue(locale);
    render(<HomeWhatIs6529 />);
    const section = within(
      screen.getByRole("region", { name: "What is 6529?" })
    );
    for (const [name, href] of [
      ["Open Main Stage", MAIN_STAGE],
      ["How TDH works", "/network/tdh"],
      ["Visit the Network Museum", "/museum/network"],
    ] as const) {
      expect(section.getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(section.getAllByRole("listitem")).toHaveLength(4);
    expect(section.queryAllByRole("img")).toHaveLength(0);
  }
);

it("names every stage in words as well as shapes", () => {
  jest.mocked(useBrowserLocale).mockReturnValue("en-US");
  render(<HomeWhatIs6529 />);
  for (const stage of ["Running", "In testing"]) {
    expect(screen.getByText(stage)).toBeInTheDocument();
  }
  expect(screen.getAllByText("In design")).toHaveLength(2);
  expect(screen.getAllByText("Status:")).toHaveLength(4);
});

it("tracks all explanation links using fixed analytics labels", () => {
  jest.mocked(useBrowserLocale).mockReturnValue("en-US");
  const { container } = render(<HomeWhatIs6529 />);
  for (const name of [
    "Open Main Stage",
    "How TDH works",
    "Visit the Network Museum",
  ] as const) {
    expect(
      getHomepageClick(container, screen.getByRole("link", { name }))
    ).toEqual({ section: "What is 6529?", action: name });
  }
});

it.each([
  [
    "people and agents",
    HomeWhatIsPeopleAndAgents,
    [
      ["How TDH works", "/network/tdh"],
      ["Browse Waves", "/waves"],
    ],
  ],
  [
    "network state",
    HomeWhatIsNetworkState,
    [
      ["Visit the museum", "/museum/network"],
      ["Open Main Stage", MAIN_STAGE],
      ["How TDH works", "/network/tdh"],
    ],
  ],
] as const)("the %s direction links to live pages", (_, Section, expected) => {
  jest.mocked(useBrowserLocale).mockReturnValue("en-US");
  render(<Section />);
  const section = within(screen.getByRole("region", { name: "What is 6529?" }));
  expect(section.getAllByRole("link")).toHaveLength(expected.length);
  for (const [name, href] of expected) {
    expect(section.getByRole("link", { name })).toHaveAttribute("href", href);
  }
});
