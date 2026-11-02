import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TdhDailyCheckPage, {
  generateMetadata,
} from "@/app/network/tdh/verification/page";
import {
  AllResults,
  resultSlots,
  ribbonResults,
} from "@/app/network/tdh/verification/components/CheckRibbon";
import { FIXTURE_INDEX_TEXT } from "@/lib/explained/fixtures/feedFixture";
import { PUBLIC_TDH_FEED_BASE } from "@/lib/tdh/verification/feedSource";
import { serveFixtureFeed } from "./fixtureFeed";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/network/tdh/verification",
  useSearchParams: () => ({ get: () => null }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const realFetch = globalThis.fetch;

async function renderPage(locale?: string) {
  return render(
    await TdhDailyCheckPage({
      searchParams: Promise.resolve(locale ? { locale } : {}),
    })
  );
}

// The pages read the reader's language from Accept-Language (the kit's
// resolveExplainedLocale); these tests read as an English browser.
jest.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => (name === "accept-language" ? "en-US" : null),
  }),
}));

describe("the daily check (TDH-DESIGN.md §4.4)", () => {
  beforeEach(() => {
    serveFixtureFeed();
  });
  afterAll(() => {
    globalThis.fetch = realFetch;
  });

  it("opens on the verdict with its limit inside, the totals and the file's hash", async () => {
    const { container } = await renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "The daily check" })
    ).toBeInTheDocument();
    const verdict = container.querySelector('[data-verdict="equal"]');
    expect(verdict).not.toBeNull();
    const block = within(verdict as HTMLElement);
    expect(
      block.getByRole("heading", {
        level: 2,
        name: "6529.io's TDH matches two separately written recomputations, for all 10,273 identities.",
      })
    ).toBeInTheDocument();
    expect(verdict).toHaveTextContent("so do all 11,126 wallets");
    // The limit sits inside the verdict, as a sentence, not a colour.
    expect(verdict).toHaveTextContent(
      "Not guaranteed: that the logs are Ethereum's."
    );
    expect(verdict?.querySelector("[data-limit]")).not.toBeNull();
    // The three totals, equal, each through its fact.
    const relations = [
      ...(verdict?.querySelectorAll("[data-relation]") ?? []),
    ].map((row) => row.getAttribute("data-relation"));
    expect(relations).toEqual(["first", "equal", "equal"]);
    expect(
      verdict?.querySelector('[data-fact="tdh.latest.total.live"]')
    ).toHaveTextContent("2,082,190,981");
    // The server hashed the file it read: it equals the index.
    expect(block.getByText("equals the index")).toBeInTheDocument();
    expect(
      block.getByRole("link", { name: "Today's receipt" })
    ).toHaveAttribute("href", "/network/tdh/verification/20744");
  });

  it("names the scope, the next result and the feed, every number a fact", async () => {
    const { container } = await renderPage();
    const meta = container.querySelector("#method");
    expect(meta).toHaveTextContent("results dated Oct 14 to Oct 18, 2026");
    expect(
      within(meta as HTMLElement).getByRole("link", { name: /RSS/ })
    ).toHaveAttribute("href", "/network/tdh/verification.rss");
    for (const id of [
      "side",
      "history",
      "classes",
      "diff",
      "check",
      "provenance",
    ]) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });

  it("shows a day that fails, marked Simulated, and keeps the button's focus", async () => {
    const user = userEvent.setup();
    const { container } = await renderPage();
    const lens = container.querySelector(
      '[data-lens="failday"]'
    ) as HTMLElement;
    const button = within(lens).getByRole("button", {
      name: "Show a day that fails",
    });
    await user.click(button);
    const failing = lens.querySelector('[data-verdict="simulated"]');
    expect(failing).not.toBeNull();
    expect(failing).toHaveTextContent("Simulated");
    expect(failing).toHaveTextContent("a constructed day, not a real one");
    expect(failing).toHaveTextContent(
      "6529.io differs from both recomputations on 2 of 10,273 identities."
    );
    expect(failing).toHaveTextContent(
      "6529.io's records for 2 identities are 118 TDH lower: class D"
    );
    // 6529.io's total is the Rust core's less the constructed difference.
    expect(failing).toHaveTextContent("≠2,082,190,863");
    expect(
      within(failing as HTMLElement).getByRole("list", {
        name: "Incident steps",
      })
    ).toHaveTextContent("Detected 00:52");
    // The latest tile turns with the verdict.
    expect(lens.querySelector('[data-day="simulated"]')).not.toBeNull();
    // One button, pressed, still focused: the verdict kept its tree.
    const back = within(lens).getByRole("button", { name: "Back to today" });
    expect(back).toHaveAttribute("aria-pressed", "true");
    expect(back).toHaveFocus();
    await user.click(back);
    expect(lens.querySelector('[data-verdict="equal"]')).not.toBeNull();
    expect(lens.querySelector('[data-day="simulated"]')).toBeNull();
  });

  it("draws every result as a link to its receipt, then the open day and the cutover", async () => {
    const { container } = await renderPage();
    const ribbon = screen.getByRole("list", { name: "Every result so far" });
    const receipts = within(ribbon)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(receipts).toEqual([
      "/network/tdh/verification/20740",
      "/network/tdh/verification/20741",
      "/network/tdh/verification/20742",
      "/network/tdh/verification/20743",
      "/network/tdh/verification/20744",
    ]);
    expect(ribbon.querySelectorAll('[data-day="equal"]')).toHaveLength(5);
    expect(ribbon.querySelector('[data-day="open"]')).not.toBeNull();
    // The caption says which files were rewritten, and when, from the facts.
    expect(container.querySelector("#history")).toHaveTextContent(
      "↻ marks a file rewritten after its run: Oct 14, Oct 15, and Oct 16 on Oct 16 at 15:59 UTC."
    );
  });

  it("draws a day the index skips as a day with no file, and opens every day below", async () => {
    // The index of the fixture without Oct 16 (cycle 20,742): a run that
    // published nothing, as on 2026-10-23 until its re-run.
    const index = JSON.parse(FIXTURE_INDEX_TEXT) as {
      days: { cycleDay: number }[];
    };
    index.days = index.days.filter((day) => day.cycleDay !== 20742);
    serveFixtureFeed({
      [`${PUBLIC_TDH_FEED_BASE}index.json`]: JSON.stringify(index),
    });
    const { container } = await renderPage();
    const ribbon = screen.getByRole("list", { name: "Every result so far" });
    const missing = ribbon.querySelector('[data-day="missing"]');
    expect(missing).not.toBeNull();
    expect(missing).toHaveAccessibleName(/Oct 16, cycle 20,742/);
    // No file, so no receipt: the tile is not a link.
    expect(missing?.closest("a")).toBeNull();
    expect(
      within(ribbon)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href"))
    ).not.toContain("/network/tdh/verification/20742");
    // The ribbon holds every day here, so the full record adds nothing.
    expect(container.querySelector("[data-all-results]")).toBeNull();
  });

  it("opens every day below the ribbon once the ribbon cannot hold them", () => {
    const days = Array.from({ length: 14 }, (_, index) => ({
      cycle: 20730 + index,
      date: `2026-10-${String(4 + index).padStart(2, "0")}`,
      verdict: "OK",
      identitiesEqual: 10,
      identitiesTotal: 10,
      writtenAt: null,
      rewritten: false,
    })).filter((day) => day.cycle !== 20735);
    const input = {
      days,
      open: { date: "2026-10-18", minutesLeft: 600, progress: 60 },
      cutover: null,
    };
    // Ten columns: the open day leaves room for nine; no empty tiles for
    // days to come take the room of days already compared.
    expect(ribbonResults(input)).toHaveLength(9);
    const slots = resultSlots(days);
    expect(slots).toHaveLength(14);
    expect(slots[5]).toEqual({ kind: "gap", cycle: 20735, date: "2026-10-09" });
    render(<AllResults input={input} daysFact={null} locale="en-US" />);
    expect(
      screen.getByRole("list", { name: "Every day since the first result" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/marks a day with no published result/)
    ).toBeInTheDocument();
  });

  it("explains the run, its limits and who can repeat each step", async () => {
    const { container } = await renderPage();
    expect(
      screen.getByRole("list", {
        name: "The day's pipeline: the steps in order",
      })
    ).toHaveTextContent("Byte for byte identical");
    expect(
      screen.getByRole("list", { name: "The comparisons the run makes" })
    ).toHaveTextContent("10,273 of 10,273");
    expect(container.querySelector("#classes")).toHaveTextContent(
      "On every day so far there is no difference of any class."
    );
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "A green day is a strong check, not a proof.",
      })
    ).toBeInTheDocument();
    expect(container.querySelector("#diff")).toHaveTextContent(
      "was planned for about Oct 23 and, as of Nov 1, has not been made. Once it is, nothing re-reads the logs"
    );
    const trail = screen.getByRole("list", {
      name: "Who can repeat each step",
    });
    expect(within(trail).getAllByRole("listitem")).toHaveLength(7);
    // The command checks the file the index lists, with its full hash.
    expect(container.querySelector("pre")).toHaveTextContent(
      "curl -s https://d379duzqnomz3w.cloudfront.net/days/20744.json"
    );
    expect(container.querySelector("pre")).toHaveTextContent(
      "1c01ed1d2c31391f74597894bb6eafe307f7da34"
    );
  });

  it("says when the feed cannot be read, and prints no number", async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    const { container } = await renderPage();
    expect(
      screen.getByText("The public feed could not be read just now.")
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-verdict="missing"]')
    ).toHaveAccessibleName("Not read");
    expect(container.textContent).not.toMatch(/2,082,190,981/);
  });

  it("reads in German when asked", async () => {
    await renderPage("de-DE");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Die tägliche Prüfung"
    );
  });

  it("sets its title and description", () => {
    const metadata = generateMetadata();
    expect(metadata.title).toBe("The daily check · 6529 Explained");
    expect(metadata.description).toMatch(/two separately written programs/);
  });
});
