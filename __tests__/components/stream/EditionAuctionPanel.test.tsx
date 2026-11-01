import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deserialize, serialize } from "node:v8";

import {
  StreamProvider,
  useStreamNow,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import EditionAuctionPanel from "@/components/stream/editions/EditionAuctionPanel";

// jsdom has no structuredClone; the mock engine snapshots state with it.
if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = ((value: unknown) =>
    deserialize(serialize(value))) as typeof structuredClone;
}

/** Reads the edition auction of the master titled `title` and renders the panel. */
function Panel({ title }: { readonly title: string }) {
  const now = useStreamNow();
  const { data: auction } = useStreamQuery(
    "test-edition-of",
    [title],
    async (source) => {
      for (const auction of await source.listEditionAuctions()) {
        const master = await source.getWork(auction.master ?? "");
        if (master?.title === title) {
          return auction;
        }
      }
      return null;
    }
  );
  return auction ? (
    <EditionAuctionPanel sale={auction} locale="en-US" now={now} />
  ) : null;
}

function renderPanel(title: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <StreamProvider>
        <Panel title={title} />
      </StreamProvider>
    </QueryClientProvider>
  );
}

const card = (name: RegExp) =>
  screen.getByRole("region", { name }) as HTMLElement;

describe("the 6529 Stream Editions auction panel", () => {
  it("shows the owner's example closed, settles in one call and claims", async () => {
    const user = userEvent.setup();
    renderPanel("Open Ledger");
    expect(
      await screen.findByText("Bidding closed: 80 editions at 0.0511 ETH.")
    ).toBeInTheDocument();
    const result = card(/6529 Stream Editions/);
    expect(result).toHaveTextContent("80 editions at 0.0511 ETH each");
    expect(result).toHaveTextContent(
      "4.088 ETH raised: 3.066 to the artist, 1.022 to the network."
    );
    const book = card(/^Bids$/);
    expect(
      await within(book).findByText("Price line: 80 at 0.0511 ETH")
    ).toBeInTheDocument();
    expect(
      await within(card(/Why 80 editions/)).findByText(
        "80 at 0.0511 raises the most, so 80 sell."
      )
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(card(/Your bids/)).toHaveTextContent("1 of 61 in")
    );

    await user.click(await screen.findByRole("button", { name: "Settle" }));
    expect(
      await screen.findByText(/Claim 1 edition and 1\.5489 ETH\./)
    ).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Claim" }));
    expect(
      await screen.findByText("Claimed: 1 edition and 1.5489 ETH.")
    ).toBeInTheDocument();
  });

  it("shows a settlement in progress that anyone can continue", async () => {
    const user = userEvent.setup();
    renderPanel("Tide Table");
    expect(
      await screen.findByText("Settling: 2 words left · anyone can continue.")
    ).toBeInTheDocument();
    expect(card(/Place a bid/)).toHaveTextContent("Bidding closed");
    await user.click(await screen.findByRole("button", { name: "Continue" }));
    expect(
      await screen.findByText(/Claim 4 editions and 0.048525 ETH/)
    ).toBeInTheDocument();
  });

  it("previews a bid on the ladder and offers the price that gets it in", async () => {
    const user = userEvent.setup();
    renderPanel("Quiet Engine");
    const box = await screen.findByRole("region", { name: /Place a bid/ });
    const price = within(box).getByLabelText("Price per edition (ETH)");
    await waitFor(() => expect(price).toHaveValue("0.01"));
    expect(await within(box).findByText("You'd be in")).toBeInTheDocument();
    expect(
      within(box).getByText("Price stays 0.01. 52 editions.")
    ).toBeVisible();

    await user.clear(price);
    await user.type(price, "0.0002");
    expect(await within(box).findByText("You'd be out")).toBeInTheDocument();
    const use = within(box).getByRole("button", { name: /^Use .* to get in$/ });
    await user.click(use);
    expect(await within(box).findByText("You'd be in")).toBeInTheDocument();

    await user.click(
      within(box).getByRole("button", { name: "One step higher" })
    );
    expect(
      within(box).getByRole("button", { name: /^Bid .* ETH$/ })
    ).toBeEnabled();
  });

  it("offers withdrawals while the 1/1 is paused for a dispute", async () => {
    renderPanel("Glass Orchard");
    expect(
      await screen.findByText("The 1/1 is paused for a dispute.")
    ).toBeInTheDocument();
    expect(
      await within(card(/Your bids/)).findByRole("button", {
        name: /^Withdraw · /,
      })
    ).toBeInTheDocument();
  });

  it("refunds every bid in full after a cancel voids the sale", async () => {
    renderPanel("Withdrawn Light");
    expect(
      await screen.findByText(
        "Void: the 1/1 was cancelled. Every bid is refunded in full."
      )
    ).toBeInTheDocument();
    expect(card(/6529 Stream Editions/)).toHaveTextContent("No editions");
    expect(
      await screen.findByRole("button", { name: "Claim" })
    ).toBeInTheDocument();
  });
});
