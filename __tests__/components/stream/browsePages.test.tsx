import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { deserialize, serialize } from "node:v8";
import { type ReactNode, useEffect } from "react";

import {
  StreamProvider,
  useStream,
} from "@/components/stream/data/StreamProvider";
import { ArtistsIndexPage } from "@/components/stream/pages/ArtistPages";
import { CurationPage } from "@/components/stream/pages/CurationPage";
import MePage from "@/components/stream/pages/MePage";
import { MuseumPage } from "@/components/stream/pages/MuseumPage";
import StreamHomePage from "@/components/stream/pages/StreamHomePage";
import type { createMockStream } from "@/lib/stream/mock";
import type { Address } from "@/lib/stream/types";

// jsdom has no structuredClone; the mock's transactions snapshot state with it.
globalThis.structuredClone ??= <T,>(value: T): T =>
  deserialize(serialize(value)) as T;

// One seeded world per test file, on a frozen clock so every countdown is stable.
jest.mock("@/lib/stream/mock", () => {
  const actual = jest.requireActual("@/lib/stream/mock");
  const world = actual.createMockStream({ wallNow: () => 0 });
  return { ...actual, createMockStream: () => world };
});

function AccountSwitch({ account }: { readonly account?: Address | null }) {
  const { setAccount } = useStream();
  useEffect(() => {
    if (account !== undefined) {
      setAccount(account);
    }
  }, [account, setAccount]);
  return null;
}

function renderPage(page: ReactNode, account?: Address | null) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <StreamProvider>
        <AccountSwitch account={account} />
        {page}
      </StreamProvider>
    </QueryClientProvider>
  );
}

function table(name: string) {
  return screen.findByRole("table", { name });
}

describe("the /stream pages on the mock", () => {
  it("leads the home page with the live grid, then closes and results", async () => {
    renderPage(<StreamHomePage />);
    const grid = await screen.findByRole("heading", { name: "Live now" });
    expect(grid).toBeInTheDocument();
    const fold = await screen.findAllByRole("link", { name: "Fold Study 7" });
    expect(fold.length).toBeGreaterThan(0);
    const soon = await table("Ending soon");
    const soonRows = within(soon).getAllByRole("row");
    expect(soonRows[1]).toHaveTextContent("Fold Study 7");
    expect(soonRows[1]).toHaveTextContent("1/1");
    expect(soonRows[2]).toHaveTextContent("Editions");
    const results = await table("Recent results");
    // Lantern Field and Tide Table (lane FE2's seed) both went unbid to the museum.
    expect(within(results).getAllByText("To the museum")).toHaveLength(2);
    expect(
      within(results).getByText("Burned: dispute upheld")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "6529 Stream Editions" })
    ).toHaveAttribute("href", "/stream/about/editions");
  });

  it("lists artists with what they raised", async () => {
    renderPage(<ArtistsIndexPage />);
    const artists = await table("Artists");
    expect(
      within(artists).getByRole("link", { name: "Mara Vell" })
    ).toBeInTheDocument();
    expect(within(artists).getByText("Recovery pending")).toBeInTheDocument();
  });

  it("shows a collector's live bids with their status and actions", async () => {
    renderPage(<MePage />);
    const bids = await table("Live bids");
    expect(within(bids).getAllByText("Leading").length).toBeGreaterThan(0);
    const claims = await table("To claim");
    const credit = within(claims).getByText("Outbid refunds").closest("tr");
    expect(credit).not.toBeNull();
    fireEvent.click(
      within(credit as HTMLElement).getByRole("button", {
        name: "Claim: Outbid refunds",
      })
    );
    await waitFor(() =>
      expect(within(claims).queryByText("Outbid refunds")).toBeNull()
    );
    expect(await screen.findByText("Done.")).toBeInTheDocument();
  });

  it("sends a settled unbid work to the museum", async () => {
    renderPage(<MuseumPage />);
    const incoming = await table("On the way");
    fireEvent.click(
      within(incoming).getByRole("button", { name: "Settle: Night Tide" })
    );
    const holdings = await table("Works received");
    await waitFor(() =>
      expect(
        within(holdings).getByRole("link", { name: "Night Tide" })
      ).toBeInTheDocument()
    );
    expect(
      await screen.findByText("No unbid auction is waiting to settle.")
    ).toBeInTheDocument();
  });

  it("shows curation states and the attested vote records", async () => {
    renderPage(<CurationPage />);
    const items = await table("Approved items");
    for (const state of [
      "Ready to start",
      "Waiting for the move",
      "Waiting for signatures",
      "Revoked",
    ]) {
      expect(within(items).getByText(state)).toBeInTheDocument();
    }
    const approvals = await table("Attested results");
    expect(within(approvals).getAllByRole("row")).toHaveLength(4);
    fireEvent.click(
      within(items).getByRole("button", {
        name: "Start the auction: Low Water",
      })
    );
    await waitFor(() =>
      expect(within(items).getByText("Auction started")).toBeInTheDocument()
    );
    expect(
      within(items).getByRole("link", { name: "View: Low Water" })
    ).toHaveAttribute("href", expect.stringMatching(/^\/stream\/works\/\d+$/));
  });

  it("labels a work that arrived through the currency-freeze exit", async () => {
    // No seeded work takes this path (ETH is never deprecated in practice),
    // so the test records one arrival the way settlement would.
    const mocked = jest.requireMock<{
      createMockStream: () => ReturnType<typeof createMockStream>;
    }>("@/lib/stream/mock");
    const { engine } = mocked.createMockStream();
    const salt = [...engine.state.tokens.values()].find(
      (token) => token.title === "Salt Meridian"
    );
    engine.state.museum.push({
      work: salt?.key ?? "1",
      arrivedAt: engine.now(),
      reason: "freeze-exit",
      txHash: `0x${"ab".repeat(32)}`,
    });
    engine.notify();
    renderPage(<MuseumPage />);
    const holdings = await table("Works received");
    expect(
      within(holdings).getByText("Currency freeze: bid refunded")
    ).toBeInTheDocument();
  });

  it("says so in one sentence when an account has nothing", async () => {
    renderPage(<MePage />, null);
    expect(
      await screen.findByText("Choose an account in the mock controls.")
    ).toBeInTheDocument();
  });
});
