import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FactsProvider from "@/components/explained/facts/FactsProvider";
import Cc0Answer from "@/app/explained/hub/Cc0Answer";
import CheckableToday from "@/app/explained/hub/CheckableToday";
import HubChapters from "@/app/explained/hub/HubChapters";
import HubLoop from "@/app/explained/hub/HubLoop";
import HubPaths from "@/app/explained/hub/HubPaths";
import { HubOpener, HubSources } from "@/app/explained/hub/HubSections";
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
    const { container } = render(<HubOpener book={book} locale="en-US" />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "How 6529 works, and how we know.",
      })
    ).toBeInTheDocument();
    const lede = container.querySelector("[data-ex-lede]");
    expect(lede).toHaveAttribute("data-ex-mission");
    // The descriptive line, with its count filled from the schedule fact,
    // and TDH spelled out on first use.
    expect(lede).toHaveTextContent(
      t("en-US", "explained.hub.mission", {
        perWeek: String(book.num("site.mainStage.perWeek")),
      })
    );
    expect(lede).toHaveTextContent("Total Days Held (TDH)");
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
    await user.click(screen.getByRole("button", { name: "5 Decide" }));
    const decide = container.querySelector("[data-station-card]");
    expect(decide).toHaveAttribute("data-station-card", "decide");
    // A station without a live chapter names the chapter that will explain
    // it, and links nowhere.
    expect(decide).toHaveTextContent(
      "Explained in Waves and decisions, a chapter still coming."
    );
    expect(within(decide as HTMLElement).queryByRole("link")).toBeNull();
    expect(
      container.querySelector('[data-station="art"] [data-fact="memes.count"]')
    ).toHaveTextContent("562 cards");
  });

  it("lists three things checked today, with who can repeat each", () => {
    const { container } = render(<CheckableToday book={book} locale="en-US" />);
    const panel = container.querySelector("[data-ex-checkable]");
    expect(panel).toHaveTextContent(
      "10,273 of 10,273 identities: 6529.io's TDH equals two separately written recomputations, in each of the 5 results since Oct 14."
    );
    // The theorem counts are the bundled manifest's, read through the facts.
    expect(panel).toHaveTextContent(
      `${book.num("manifest.proved").toLocaleString("en-US")} Lean theorems about a model of the rules, checked by machine. ${book.num("manifest.shownFalse")} earlier draft statements were shown false and stay on record.`
    );
    // The proved day carries its retired rule in the same sentence.
    expect(panel).toHaveTextContent(
      "One real day, half proved Proof A proved the day of Oct 11 (cycle 20,737) under the retired tdh-v1.0 rules, and mainnet's SP1 verifier accepts it in a read-only call that writes nothing. Proof B is not done. Under TDH v1.4 both proofs exist only for a synthetic test cycle."
    );
    // What anyone can repeat today, and what needs private code.
    expect(panel).toHaveTextContent(
      "Anyone can check each day's file against the index and add up 6529.io's signed upload. Recomputing a day takes your own program, written from the specification, and your own read of Ethereum; 6529's two programs are private for now (D116)."
    );
    expect(panel).not.toHaveTextContent("repeat the daily comparison");
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
      'software 0.1.0, built and being tested; "run one" waits on its release (D144)'
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
      "Meme Card #1 shows a CryptoPunk, whose copyright was never the artist's to give, so CC0 does not cover the Punk itself."
    );
    expect(
      screen.getByRole("link", { name: "Open Meme #2, full size" })
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
        <HubSources book={book} locale="en-US" />
      </>
    );
    const paths = screen.getByRole("list", { name: "Reader paths" });
    expect(within(paths).getAllByRole("link")).toHaveLength(8);
    expect(
      within(paths).getByRole("link", { name: /I make art/ })
    ).toHaveAttribute("href", "#cc0");
    expect(container.querySelectorAll("[data-mark]").length).toBeGreaterThan(8);
    expect(container.querySelector("#corrections")).toHaveTextContent(
      "None yet."
    );
    expect(container.querySelector("[data-ex-hwk]")).toHaveTextContent(
      `through ${book.text("rules.newestDecision")}`
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
