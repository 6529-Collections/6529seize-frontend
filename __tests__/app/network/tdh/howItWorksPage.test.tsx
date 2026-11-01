import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TdhHowItWorksPage, {
  generateMetadata,
} from "@/app/network/tdh/how-it-works/page";
import { createFactBook } from "@/lib/explained/facts";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";

/**
 * 1 How it works (TDH-DESIGN.md §4.2, §5.3 to §5.7) on the facts of the
 * final mockups: every old step anchor lands, every model opens on its
 * example and its Break it reaches the rule's edge, with the readouts the
 * design and the Lean manifest give.
 */
const mockInputs = jest.fn(fixtureFactInputs);

jest.mock("@/lib/explained/feed.server", () => ({
  loadFactBook: async () => createFactBook(mockInputs()),
}));

async function renderPage(locale?: string) {
  const element = await TdhHowItWorksPage({
    searchParams: Promise.resolve(locale ? { locale } : {}),
  });
  return render(element);
}

function lens(id: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(`[data-lens="${id}"]`);
  if (!found) throw new Error(`no lens ${id}`);
  return found;
}

function breakIt(id: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(`[data-break="${id}"]`);
  if (!found) throw new Error(`no Break it ${id}`);
  return found;
}

// The pages read the reader's language from Accept-Language (the kit's
// resolveExplainedLocale); these tests read as an English browser.
jest.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => (name === "accept-language" ? "en-US" : null),
  }),
}));

describe("How TDH is calculated", () => {
  it("keeps every anchor of the fourteen steps inside its part", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "How TDH is calculated" })
    ).toBeInTheDocument();
    for (let step = 1; step <= 14; step += 1) {
      expect(document.getElementById(`step-${step}`)).not.toBeNull();
    }
    for (const id of [
      "tdh-exact",
      "tdh-1-4",
      "part-a",
      "part-b",
      "part-c",
      "part-d",
      "part-n",
    ]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
    const parts = screen.getByRole("navigation", { name: "The four parts" });
    expect(within(parts).getAllByRole("link")).toHaveLength(4);
    expect(
      screen.getByRole("link", { name: /Next · 2\s*Your wallets/ })
    ).toHaveAttribute("href", "/network/tdh/consolidation");
  });

  it("A card ages: Oct 19, the guess, and sold before a day", async () => {
    const user = userEvent.setup();
    await renderPage();
    const model = lens("firstday");
    expect(model).toHaveTextContent(
      "The result dated Monday, Oct 19 counts its first whole day (28 h 55 min held). The one before found 4 h 55 min: not a whole day."
    );
    await user.click(within(model).getByRole("button", { name: "Oct 19" }));
    expect(model).toHaveTextContent(
      "Right. Oct 19. The snapshot of Oct 18 finds one minute; the snapshot of Oct 19 finds 24 hours and one minute."
    );
    await user.click(
      model.querySelector<HTMLElement>('[data-at="afterMidnight"]')!
    );
    expect(model).toHaveTextContent("The result dated Tuesday, Oct 20");
    await user.click(breakIt("sellearly"));
    expect(model).toHaveAttribute("data-broken", "1");
    expect(model).toHaveTextContent(
      "It left before a whole day: no result ever counts it"
    );
    await user.click(breakIt("sellearly"));
    expect(model).toHaveAttribute("data-broken", "0");
  });

  it("Inside one transaction: 300 days kept, and counterexample H", async () => {
    const user = userEvent.setup();
    await renderPage();
    const model = lens("netting");
    expect(model).toHaveTextContent("300 days");
    await user.click(within(model).getByRole("button", { name: "Each step" }));
    expect(model).toHaveTextContent("0 days");
    await user.click(breakIt("mintburn"));
    expect(model).toHaveTextContent("800 → 1,600");
    expect(model).toHaveTextContent(
      "minted rises from 10 to 20, H from 10 to 20, the rate of Meme #2 from 2.00 to 4.00, and B's TDH from 800 to 1,600"
    );
    expect(model).toHaveTextContent("Where the proof stops.");
  });

  it("The rate and the edition floor: 12.71, and #562 counted as 310", async () => {
    const user = userEvent.setup();
    await renderPage();
    const model = lens("rates");
    expect(model).toHaveTextContent(
      "A 310-copy card: each copy adds 12.71 a day; all 310 copies together add 3,940 a day"
    );
    await user.click(within(model).getByRole("button", { name: "1,000 (#2)" }));
    expect(model).toHaveTextContent("3.94");
    await user.click(breakIt("floor"));
    expect(model).toHaveTextContent("152 minted, counted as 310.");
    expect(model).toHaveTextContent("min(claim limit, 310) = 310");
    expect(model).toHaveTextContent("H = 3,941 (FirstGM: 6,529 − 2,588)");
  });

  it("The boost ladder: 1.02, a sixth Gradient adds nothing", async () => {
    const user = userEvent.setup();
    await renderPage();
    const model = lens("boost");
    expect(model).toHaveTextContent("1.02boost");
    await user.click(
      within(model).getByRole("button", { name: "One more: Gradients" })
    );
    expect(model).toHaveTextContent("1.04boost");
    await user.click(breakIt("gradient"));
    expect(model).toHaveTextContent("A sixth Gradient adds nothing.");
    expect(model).toHaveTextContent("1.10boost");
    expect(model).toHaveAttribute("data-broken", "1");
    await user.click(breakIt("gradient"));
    expect(model).toHaveTextContent("1.04boost");
    await user.click(
      within(model).getByRole("button", { name: "Genesis #1 to #3" })
    );
    expect(model).toHaveTextContent(
      "Genesis (#1 to #3) and Nakamoto (#4) count only while the first season is not complete."
    );
  });

  it("Which cards count: #562 from Oct 18, and counterexample I", async () => {
    const user = userEvent.setup();
    await renderPage();
    const model = lens("eligible");
    expect(model).toHaveTextContent(
      "Meme #562 was first minted Oct 16, 09:06 UTC. The result dated Sunday, Oct 18 is the first whose snapshot finds that a whole day old"
    );
    expect(model).toHaveTextContent("#562: firstMint = Oct 16, 09:06 UTC");
    await user.click(model.querySelector<HTMLElement>('[data-card="561"]')!);
    expect(model).toHaveTextContent("The result dated Friday, Oct 16");
    await user.click(breakIt("mintearly"));
    expect(model).toHaveAttribute("data-broken", "1");
    expect(model).toHaveTextContent("32 → 60");
    expect(model).toHaveTextContent("Where the rule reads every mint.");
    await user.click(breakIt("mintearly"));
    expect(model).toHaveAttribute("data-broken", "0");
  });

  it("Which cards count: says so when the first mints are missing, and still breaks", async () => {
    const user = userEvent.setup();
    mockInputs.mockImplementationOnce(() => {
      const inputs = fixtureFactInputs();
      const editions = inputs.editions!;
      return {
        ...inputs,
        editions: {
          ...editions,
          cards: editions.cards.map((card) => ({ ...card, firstMint: null })),
        },
      };
    });
    await renderPage();
    const model = lens("eligible");
    expect(model).toHaveTextContent("First mints not available.");
    await user.click(breakIt("mintearly"));
    expect(model).toHaveTextContent("32 → 60");
  });

  it("Sales and moves: last in, first out", async () => {
    const user = userEvent.setup();
    await renderPage();
    const model = lens("stacks");
    expect(model).toHaveTextContent("310 days");
    await user.click(
      within(model).getByRole("button", { name: "A sells one" })
    );
    expect(model).toHaveTextContent("A's 10-day copy leaves");
    expect(model).toHaveTextContent("300 days");
    await user.click(breakIt("movesell"));
    expect(model).toHaveAttribute("data-broken", "1");
    expect(model).toHaveTextContent("The old copy left first.");
    expect(model).toHaveTextContent("300 days leave, not 10");
  });

  it("An identity: one band of 1.05, two collectors, or one way only", async () => {
    const user = userEvent.setup();
    await renderPage();
    const model = lens("identity");
    expect(model).toHaveTextContent(
      "Linked, A and B together hold all 32 cards of season 13, so one boost of 1.05 applies to every card."
    );
    expect(model).toHaveTextContent("42,720TDH");
    await user.click(within(model).getByRole("button", { name: "Not linked" }));
    expect(model).toHaveTextContent(
      "35,588 and 5,084, two separate collectors"
    );
    await user.click(breakIt("oneway"));
    expect(model).toHaveAttribute("data-broken", "1");
    expect(model).toHaveTextContent("One way is no link.");
  });

  it("Adding it up: identity finals, never the wallets'", async () => {
    const user = userEvent.setup();
    await renderPage();
    const model = lens("totals");
    expect(model).toHaveTextContent("42,720TDH");
    await user.click(breakIt("wallets"));
    expect(model).toHaveTextContent("40,672TDH");
    expect(model).toHaveTextContent("Short by 2,048.");
  });

  it("lists every step in P26's order, each linked to its model", async () => {
    await renderPage();
    const steps = document.querySelectorAll("[data-step]");
    expect(steps).toHaveLength(12);
    expect(
      within(steps[steps.length - 1] as HTMLElement).getByRole("link", {
        name: "Totals",
      })
    ).toHaveAttribute("href", "#part-n");
    expect(steps[1]).toHaveTextContent("firstMint ≤ T − 86,400");
  });

  it("prints the network from the latest day, every number a fact", async () => {
    await renderPage();
    const section = document.getElementById("part-n")!;
    expect(section).toHaveTextContent(
      "2,082,190,981 in the result dated Oct 18"
    );
    expect(
      within(section).getByRole("link", { name: "The day's receipt" })
    ).toHaveAttribute("href", "/network/tdh/verification/20744");
    for (const value of section.querySelectorAll("[data-fact]")) {
      expect(value.getAttribute("data-fact")).toMatch(/^[a-z]/);
    }
  });

  it("renders in German, the longest copy", async () => {
    await renderPage("de-DE");
    expect(
      screen.getByRole("heading", { level: 1, name: "So wird TDH berechnet" })
    ).toBeInTheDocument();
    expect(lens("rates")).toHaveTextContent("12,71");
  });

  it("sets its metadata", () => {
    expect(generateMetadata()).toMatchObject({
      title: expect.stringContaining("How TDH is calculated"),
    });
  });
});
