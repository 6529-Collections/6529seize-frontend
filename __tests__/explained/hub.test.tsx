import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FactsProvider from "@/components/explained/facts/FactsProvider";
import Cc0Answer from "@/app/explained/hub/Cc0Answer";
import CheckableToday from "@/app/explained/hub/CheckableToday";
import HubChapters from "@/app/explained/hub/HubChapters";
import HubLoop from "@/app/explained/hub/HubLoop";
import HubPaths from "@/app/explained/hub/HubPaths";
import {
  Corrections,
  HubOpener,
  HubSources,
} from "@/app/explained/hub/HubSections";
import ReadingGuide from "@/app/explained/hub/ReadingGuide";
import { explainedNavItem } from "@/components/navigation/explainedNavEntry";
import { t } from "@/i18n/messages";
import { createFactBook } from "@/lib/explained/facts";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";

const book = createFactBook(fixtureFactInputs());

function withFacts(node: React.ReactNode) {
  return render(
    <FactsProvider snapshot={book.snapshot()}>{node}</FactsProvider>
  );
}

describe("the hub, first version", () => {
  it("opens on the title and the mission line, one swappable key", () => {
    const { container } = render(<HubOpener locale="en-US" />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "How 6529 works, and how we know.",
      })
    ).toBeInTheDocument();
    const lede = container.querySelector("[data-ex-lede]");
    expect(lede).toHaveAttribute("data-ex-mission");
    expect(lede).toHaveTextContent(t("en-US", "explained.hub.mission"));
  });

  it("draws the loop with live numbers and steps a copy round it", async () => {
    const user = userEvent.setup();
    const { container } = withFacts(<HubLoop book={book} locale="en-US" />);
    const card = container.querySelector("[data-station-card]");
    expect(card).toHaveAttribute("data-station-card", "time");
    expect(card).toHaveTextContent("2,082,190,981 TDH");
    expect(
      within(card as HTMLElement).getByRole("link", { name: /Chapter 01: TDH/ })
    ).toHaveAttribute("href", "/network/tdh");
    await user.click(screen.getByRole("button", { name: "5 Votes" }));
    expect(container.querySelector("[data-station-card]")).toHaveTextContent(
      "221 decisions"
    );
    expect(
      container.querySelector('[data-station="art"] [data-fact="memes.count"]')
    ).toHaveTextContent("562 cards");
  });

  it("lists three things anyone can check, with who runs the checks", () => {
    const { container } = render(<CheckableToday book={book} locale="en-US" />);
    const panel = container.querySelector("[data-ex-checkable]");
    expect(panel).toHaveTextContent(
      "10,273 of 10,273 identities: 6529.io's TDH equals two separately written recomputations, on each of the last 5 days."
    );
    expect(panel).toHaveTextContent(
      "78 Lean theorems about the rules, with 11 earlier claims shown false and kept on record."
    );
    expect(panel).toHaveTextContent("The second proof is not done.");
    expect(panel).toHaveTextContent(
      "For now the checks are run by 6529 and read by everyone."
    );
  });

  it("lists TDH live, the rest coming in order, with no link until they ship", () => {
    render(<HubChapters book={book} locale="en-US" />);
    const list = screen.getByRole("list", { name: "The chapters" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(8);
    expect(within(list).getAllByRole("link")).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("checked every day since Oct 14");
    expect(rows[1]).toHaveTextContent(
      "waits on: how cards were chosen before Main Stage"
    );
    expect(rows[3]).toHaveTextContent(
      'software 0.1.0; "run one" waits on the code (D116)'
    );
    expect(rows[6]).toHaveTextContent("6529 Stream Editions");
    expect(list).not.toHaveTextContent("NIC's full name");
    expect(rows.map((row) => row.getAttribute("data-chapter"))).toEqual([
      "tdh",
      "memes",
      "waves",
      "validators",
      "nextgen",
      "standing",
      "works",
      "network",
    ]);
  });

  it("answers CC0 in one minute, with where it stops and the absolute behind it", () => {
    const { container } = render(<Cc0Answer locale="en-US" />);
    expect(container.querySelector("#cc0")).not.toBeNull();
    expect(
      screen.getByRole("heading", {
        name: "The art is free. Holding is what counts.",
      })
    ).toBeInTheDocument();
    expect(container.querySelector('[data-limit="limit"]')).toHaveTextContent(
      "Meme Card #1 shows a CryptoPunk, which is Yuga Labs' copyright. 6529 Gradients are not CC0."
    );
    expect(
      screen.getByRole("link", { name: "Download Meme #2" })
    ).toHaveAttribute("href", expect.stringContaining("/original/"));
    expect(container.querySelector('[data-mark="absolute"]')).toHaveTextContent(
      "CC0 for The Memes, D89"
    );
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });

  it("shows the paths, the guide, the corrections log and the sources", () => {
    const { container } = withFacts(
      <>
        <HubPaths locale="en-US" />
        <ReadingGuide locale="en-US" />
        <Corrections locale="en-US" />
        <HubSources book={book} locale="en-US" />
      </>
    );
    const paths = screen.getByRole("list", { name: "Reader paths" });
    expect(within(paths).getAllByRole("link")).toHaveLength(7);
    expect(
      within(paths).getByRole("link", { name: /I make art/ })
    ).toHaveAttribute("href", "#cc0");
    expect(container.querySelectorAll("[data-mark]").length).toBeGreaterThan(8);
    expect(container.querySelector("#corrections")).toHaveTextContent(
      "None yet."
    );
    expect(container.querySelector("[data-ex-hwk]")).toHaveTextContent(
      "through D142"
    );
  });
});

describe("the About menu's door", () => {
  it("is one entry, defined once, that the About flyout lists first", () => {
    expect(explainedNavItem()).toEqual({
      name: "6529 Explained",
      href: "/explained",
      activePathPrefixes: ["/explained/"],
    });
  });
});
