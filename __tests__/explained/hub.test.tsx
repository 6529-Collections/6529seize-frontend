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
    // The card follows the copy: its own TDH heads it, the network's total
    // stays on the loop and in the sentence.
    expect(card).toHaveTextContent("394 TDH");
    expect(card).toHaveTextContent(
      "All holders together, on Oct 18: 2,082,190,981."
    );
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
    expect(panel).toHaveTextContent("10,273 of 10,273 identities");
    expect(panel).toHaveTextContent(
      "6529.io's TDH equals two separately written recomputations, in each of the 5 results since Oct 14."
    );
    // The theorem counts are the bundled manifest's, read through the facts.
    expect(panel).toHaveTextContent(
      `${book.num("manifest.proved.tdh").toLocaleString("en-US")} Lean theorems`
    );
    expect(panel).toHaveTextContent(
      `About a model of TDH's rules, and ${book.num("manifest.proved.p53")} more about the proposed validator rules, from before D144, D148 and D150. Lean proves things about rules, never about a day. ${book.num("manifest.shownFalse.tdh")} counterexamples stay on record.`
    );
    // The proved day carries its retired rule in the same sentence.
    expect(panel).toHaveTextContent("One real day, half proved");
    expect(panel).toHaveTextContent(
      "A zero-knowledge proof lets a contract check a program's result without running it again; each day needs one from each of two programs. One real day, Oct 11, has the first, under rules since retired. Nothing is on Ethereum yet, and only 6529 holds the proof file (D116)."
    );
    // What anyone can repeat today, and what needs private code.
    expect(panel).toHaveTextContent(
      "Anyone can check each day's file against the index and add up 6529.io's signed upload; recomputing a day needs your own program and read of Ethereum, as 6529's are private (D116). Your TDH is in each of those results: see yours."
    );
    expect(panel).not.toHaveTextContent("repeat the daily comparison");
  });

  it("lists TDH live, the rest coming in order, linking only what has shipped", () => {
    render(<HubChapters book={book} locale="en-US" />);
    const list = screen.getByRole("list", { name: "The chapters" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(8);
    // TDH's row, and the one Validators page live before its chapter.
    expect(
      within(list)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href"))
    ).toEqual(["/network/tdh", "#cc0", "/explained/validators/hardware"]);
    expect(rows[0]).toHaveTextContent("checked every day since Oct 14");
    expect(rows[1]).toHaveTextContent(
      "waits on: how cards were chosen before Main Stage"
    );
    expect(rows[3]).toHaveTextContent(
      "software 0.1.0, built and being tested; live already: Hardware"
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

  it("answers CC0 in one minute, with where it stops and the absolute behind it", async () => {
    const user = userEvent.setup();
    const { container } = withFacts(<Cc0Answer book={book} locale="en-US" />);
    expect(container.querySelector("#cc0")).not.toBeNull();
    expect(
      screen.getByRole("heading", {
        name: "The art is free. Holding is what counts.",
      })
    ).toBeInTheDocument();
    expect(container.querySelector('[data-limit="limit"]')).toHaveTextContent(
      "CC0 stops at 6529 Gradients, which are not CC0, and at other people's rights: Meme Card #1 shows a CryptoPunk, which CC0 does not cover."
    );
    expect(
      screen.getByRole("link", { name: "Open Meme #2, full size" })
    ).toHaveAttribute("href", expect.stringContaining("/original/"));
    expect(container.querySelector('[data-mark="absolute"]')).toHaveTextContent(
      "CC0 for The Memes, D89"
    );
    expect(screen.getAllByRole("img", { name: /^Meme #\d+/ })).toHaveLength(3);
    // The artist's three boxes, the copies read from the facts (D91).
    expect(container.querySelector('[data-cc0="keep"]')).toHaveTextContent(
      "5 copies of each card plus 15 for people you choose"
    );
    expect(container.querySelector('[data-cc0="unstated"]')).not.toBeNull();
    // The model: a Meme card may be sold; a Gradient may not, and the lens
    // turns rose.
    const lens = container.querySelector('[data-lens="licence"]');
    expect(lens).toHaveTextContent("Yes.");
    await user.click(screen.getByRole("button", { name: "A 6529 Gradient" }));
    expect(lens).toHaveAttribute("data-broken", "1");
    expect(lens).toHaveTextContent("Not without permission.");
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
