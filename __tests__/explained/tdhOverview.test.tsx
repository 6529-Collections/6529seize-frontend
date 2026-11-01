import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import FactsProvider from "@/components/explained/facts/FactsProvider";
import { MEME_ART } from "@/app/network/tdh/overview/art";
import ExplainedOverview from "@/app/network/tdh/overview/ExplainedOverview";
import ExplainMyTdh from "@/app/network/tdh/overview/ExplainMyTdh";
import Machine, { type MachineCard } from "@/app/network/tdh/overview/Machine";
import NetworkDistribution from "@/app/network/tdh/overview/NetworkDistribution";
import { createFactBook, type FactId } from "@/lib/explained/facts";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  getStructuredApiErrorStatus: (error: unknown) =>
    (error as { status?: number }).status ?? null,
}));

const CARDS: MachineCard[] = [
  { id: 2, title: MEME_ART[2].title, art: MEME_ART[2].src },
  { id: 4, title: MEME_ART[4].title, art: MEME_ART[4].src },
  { id: 3, title: MEME_ART[3].title, art: MEME_ART[3].src },
  { id: 562, title: null, art: null },
];

function fixtureBook() {
  const book = createFactBook(fixtureFactInputs());
  for (const id of [2, 3, 4, 8, 560, 562]) {
    for (const field of ["edition", "minted", "rate"]) {
      book.maybe(`meme.${id}.${field}` as FactId);
    }
  }
  book.maybe("memes.editions");
  return book;
}

function withFacts(node: ReactNode) {
  const book = fixtureBook();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <FactsProvider snapshot={book.snapshot()}>{node}</FactsProvider>
    </QueryClientProvider>
  );
}

describe("the machine", () => {
  it("opens on one copy of Meme #2 held 100 days: 394 TDH", () => {
    const { container } = withFacts(<Machine cards={CARDS} locale="en-US" />);
    const machine = container.querySelector('[data-lens="machine"]');
    expect(machine).toHaveAttribute("data-broken", "0");
    expect(screen.getByText("Meme #2 · SeizeJPGs")).toBeInTheDocument();
    expect(screen.getByText("1,000 copies · CC0")).toBeInTheDocument();
    expect(
      screen.getByText("3,941, the largest edition, ÷ 1,000 copies")
    ).toBeInTheDocument();
    expect(screen.getByText("394")).toBeInTheDocument();
    expect(screen.getByText(/Tomorrow's result adds/)).toHaveTextContent(
      "Tomorrow's result adds 4, rounded per card."
    );
  });

  it("gives Meme #4 with one Gradient 1,335 TDH (TDH-DESIGN.md §5.1)", async () => {
    const user = userEvent.setup();
    const { container } = withFacts(<Machine cards={CARDS} locale="en-US" />);
    await user.click(screen.getByRole("button", { name: "Meme #4" }));
    await user.click(
      container.querySelector('[data-beta="102"]') as HTMLElement
    );
    expect(screen.getByText("1,335")).toBeInTheDocument();
    expect(screen.getByText("one Gradient")).toBeInTheDocument();
    expect(screen.getByText("301 copies · CC0")).toBeInTheDocument();
  });

  it("counts the newest card at its floor while it is still minting", async () => {
    const user = userEvent.setup();
    withFacts(<Machine cards={CARDS} locale="en-US" />);
    await user.click(
      screen.getByRole("button", { name: "Meme #562, still minting" })
    );
    expect(
      screen.getByText("152 minted so far · counts as 310 · CC0")
    ).toBeInTheDocument();
    expect(screen.getByText("12.71")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Meme #562, still minting" })
    ).toBeInTheDocument();
  });

  it("breaks: selling the copy takes its days, and pressing again restores them", async () => {
    const user = userEvent.setup();
    const { container } = withFacts(<Machine cards={CARDS} locale="en-US" />);
    const breakIt = screen.getByRole("button", { name: "Break it: sell it" });
    await user.click(breakIt);
    const machine = container.querySelector('[data-lens="machine"]');
    expect(machine).toHaveAttribute("data-broken", "1");
    expect(breakIt).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Sold.")).toBeInTheDocument();
    // The area the copy took with it, drawn where it was.
    expect(screen.getByText("100 days left with the copy")).toBeInTheDocument();
    expect(container.querySelector("[data-area-lost]")).not.toBeNull();
    await user.click(breakIt);
    expect(machine).toHaveAttribute("data-broken", "0");
    expect(screen.getByText("394")).toBeInTheDocument();
  });

  it("says so, with no number, when the editions cannot be read", () => {
    const inputs = { ...fixtureFactInputs(), editions: null };
    const book = createFactBook(inputs);
    for (const card of CARDS) {
      book.maybe(`meme.${card.id}.edition` as FactId);
      book.maybe(`meme.${card.id}.minted` as FactId);
    }
    render(
      <FactsProvider snapshot={book.snapshot()}>
        <Machine cards={CARDS} locale="en-US" />
      </FactsProvider>
    );
    expect(screen.getByText("not available")).toBeInTheDocument();
  });
});

describe("Explain my TDH", () => {
  const fetchMock = commonApiFetch as jest.MockedFunction<
    typeof commonApiFetch
  >;
  afterEach(() => fetchMock.mockReset());

  it("shows the example record: 6,399 TDH, included in the latest result", () => {
    withFacts(<ExplainMyTdh locale="en-US" />);
    expect(screen.getByText("Example records")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "A record found" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("6,399 TDH")).toBeInTheDocument();
    // A constructed record was never compared: no verdict sits on it.
    expect(screen.queryByText("This record was included.")).toBeNull();
    expect(
      screen.getByText(/For a real record, this line says whether/)
    ).toBeInTheDocument();
  });

  it("shows when a card just bought first counts, and a name not found", async () => {
    const user = userEvent.setup();
    withFacts(<ExplainMyTdh locale="en-US" />);
    await user.click(screen.getByRole("button", { name: "Just bought" }));
    expect(
      screen.getByText("Your card counts from Mon, Oct 19.")
    ).toBeInTheDocument();
    expect(screen.getByText(/found 4 h 55 min: not a whole day/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Not found" }));
    expect(
      screen.getByText("No wallet found by that name.")
    ).toBeInTheDocument();
  });

  function profile(block: number) {
    return {
      block,
      date: "2026-10-18T00:00:00.000Z",
      wallets: ["0x0000000000000000000000000000000000000001"],
      consolidation_display: "a collector",
      tdh: 6_272,
      tdh__raw: 1_592,
      boost: 1,
      boosted_tdh: 6_272,
      boosted_tdh_rate: 4,
      memes: [
        {
          id: 2,
          balance: 1,
          tdh: 6_272,
          tdh__raw: 1_592,
          hodl_rate: 3.94,
          days_held_per_edition: [1592],
        },
      ],
      gradients: [],
      nextgen: [],
      boost_breakdown: {},
    };
  }

  it("looks a record up on 6529.io and says the comparison included it", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(profile(26_215_721));
    withFacts(<ExplainMyTdh locale="en-US" />);
    await user.type(
      screen.getByRole("textbox", {
        name: "A profile, an ENS name or an address",
      }),
      "@collector"
    );
    await user.click(screen.getByRole("button", { name: "Explain" }));
    expect(await screen.findByText("TDH for collector")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "tdh/consolidation/collector",
        includeWalletAuth: false,
      })
    );
    expect(screen.queryByText("Example records")).not.toBeInTheDocument();
    expect(screen.getByText("This record was included.")).toBeInTheDocument();
    expect(screen.getAllByText("Meme #2")[0]).toBeInTheDocument();
  });

  it("says when a record is not in a comparison yet", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(profile(26_220_000));
    withFacts(<ExplainMyTdh locale="en-US" />);
    await user.type(screen.getByRole("textbox"), "collector");
    await user.click(screen.getByRole("button", { name: "Explain" }));
    expect(
      await screen.findByText("Not in a comparison yet.")
    ).toBeInTheDocument();
  });

  it("answers a 404 with not found, and other errors with a retry", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValueOnce({ status: 404 });
    withFacts(<ExplainMyTdh locale="en-US" />);
    await user.type(screen.getByRole("textbox"), "nobody");
    await user.click(screen.getByRole("button", { name: "Explain" }));
    expect(
      await screen.findByText("No wallet found by that name.")
    ).toBeInTheDocument();

    fetchMock.mockRejectedValueOnce({ status: 500 });
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "somebody");
    await user.click(screen.getByRole("button", { name: "Explain" }));
    expect(
      await screen.findByText("6529.io did not answer. Try again in a moment.")
    ).toBeInTheDocument();
    fetchMock.mockResolvedValueOnce(profile(26_215_721));
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(screen.getByText("TDH for somebody")).toBeInTheDocument()
    );
  });
});

describe("the overview", () => {
  it("prints every section with its anchors, its facts and its marks", () => {
    const book = fixtureBook();
    const { container } = withFacts(
      <ExplainedOverview
        book={book}
        locale="en-US"
        cards={CARDS}
        network={false}
      />
    );
    for (const id of [
      "tdh-minute",
      "tdh-example",
      "tdh-reference",
      "tdh-weight",
      "your-number",
      "tdh-profile",
      "explain",
      "tdh-verified",
      "tdh-deeper",
      "tdh-explore",
    ]) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
    expect(
      screen.getByRole("heading", { level: 1, name: "Total Days Held" })
    ).toBeInTheDocument();
    expect(container.querySelector("[data-ex-lede]")).toHaveTextContent(
      "Every card you hold adds its rate for each whole day held"
    );
    expect(
      container.querySelector('[data-fact="tdh.latest.total"]')
    ).toHaveTextContent("2,082,190,981");
    expect(container.querySelectorAll("[data-rung]")).toHaveLength(7);
    expect(container.querySelector('[data-rung="4"]')).toHaveAttribute(
      "data-reached",
      "0"
    );
    expect(screen.getByRole("link", { name: "CC0" })).toHaveAttribute(
      "href",
      "/explained#cc0"
    );
    expect(
      screen.getByRole("link", {
        name: /Why did my TDH change\? Pick what happened/,
      })
    ).toHaveAttribute("href", "/network/tdh/consolidation#why");
    expect(
      container.querySelector('[data-fact="site.validator.version"]')
    ).toHaveTextContent("0.1.0");
    expect(container.querySelector('[data-fig="network"]')).toBeNull();
    const index = screen.getByRole("list", {
      name: "The pages of this chapter",
    });
    expect(within(index).getAllByRole("link")).toHaveLength(10);
  });

  it("shows the network's distribution when the owner's flag is on", () => {
    const { container } = render(
      <NetworkDistribution
        locale="en-US"
        data={{
          total: 1000,
          identities: 1100,
          source: "test",
          readAt: "2026-10-31T09:12:00Z",
          groups: [
            { key: "top", count: 10, tdh: 400 },
            { key: "next", count: 90, tdh: 300 },
            { key: "next2", count: 900, tdh: 250 },
            { key: "rest", count: 100, tdh: 50 },
          ],
        }}
      />
    );
    expect(container.querySelector('[data-fig="network"]')).not.toBeNull();
    expect(screen.getByText("top 10")).toBeInTheDocument();
    expect(screen.getByText("the other 100")).toBeInTheDocument();
    expect(
      screen.getByText(/The top 100 identities hold 70\.0% of today's TDH/)
    ).toHaveTextContent(
      "The groups count the 1,100 identities 6529.io's API ranks with TDH above zero, so they add up to fewer than the identities the daily check compares. Read Oct 31, 09:12 UTC."
    );
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(5);
    expect(
      within(table).getByRole("rowheader", { name: "next 900" })
    ).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Today's TDH as one area, split by rank: the top identities' share of the total, and their share of the identities."
    );
  });
});

describe("how we know, on the overview", () => {
  it("draws rung 5 as programs A and B in their provers, and rung 7 as built, being tested", () => {
    const { container } = withFacts(
      <ExplainedOverview
        book={fixtureBook()}
        locale="en-US"
        cards={CARDS}
        network={false}
      />
    );
    const zk = container.querySelector('[data-rung="5"]');
    expect(zk).toHaveTextContent(
      "Proof A, program A in SP1: proved the day of Oct 11 under tdh-v1.0, the rules' earlier version; mainnet's SP1 verifier accepts it in a read-only call."
    );
    expect(zk).toHaveTextContent(
      "Proof B, program B in RISC Zero, written separately from A and from the Python reference: no mainnet day yet. Under TDH v1.4, programs A and B both proved one synthetic test cycle."
    );
    expect(zk?.querySelector('[data-proof="A"]')).toHaveAttribute(
      "data-proved",
      "1"
    );
    expect(zk?.querySelector('[data-proof="B"]')).toHaveAttribute(
      "data-proved",
      "0"
    );
    expect(container.querySelector('[data-rung="6"]')).toHaveTextContent(
      "A contract would record a day only with both proofs. Built, tested on a copy of mainnet, not deployed."
    );
    expect(container.querySelector('[data-rung="7"]')).toHaveTextContent(
      /Built\s*0\.1\.0, being tested/
    );
    expect(
      screen.getByRole("link", { name: /What is proved, and what is not/ })
    ).toHaveAttribute("href", "/network/tdh/formal");
  });

  it("names NIC where it first uses it, and the hero's ribbon shows the last five results and the open day", () => {
    const { container } = withFacts(
      <ExplainedOverview
        book={fixtureBook()}
        locale="en-US"
        cards={CARDS}
        network={false}
      />
    );
    expect(container.querySelector("#tdh-weight")).toHaveTextContent(
      "Rep and NIC (Network Identity Check) are ratings collectors give each other"
    );
    const ribbon = container.querySelector("[data-livestrip] ol");
    expect(ribbon?.querySelectorAll("li")).toHaveLength(6);
  });

  it("lists the spine and the shelf in one list, spine first", () => {
    withFacts(
      <ExplainedOverview
        book={fixtureBook()}
        locale="en-US"
        cards={CARDS}
        network={false}
      />
    );
    const index = screen.getByRole("list", {
      name: "The pages of this chapter",
    });
    const links = within(index).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/network/tdh/how-it-works",
      "/network/tdh/consolidation",
      "/network/tdh/verification",
      "/network/tdh/formal",
      "/network/tdh/proofs",
      "/network/tdh/specification",
      "/network/tdh/implementations",
      "/network/tdh/consolidation/design",
      "/network/tdh/historic-boosts",
      "/network/tdh/glossary",
    ]);
  });
});
