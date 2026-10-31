import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { deserialize, serialize } from "node:v8";
import type { ReactNode } from "react";

import {
  StreamProvider,
  useStream,
} from "@/components/stream/data/StreamProvider";
import DevWorkControls from "@/components/stream/work/DevWorkControls";
import WorkPage from "@/components/stream/work/WorkPage";
import {
  type createMockStream as CreateMockStream,
  MOCK_ACCOUNTS,
} from "@/lib/stream/mock";
import type { Address, WorkVariant } from "@/lib/stream/types";

type MockStream = ReturnType<typeof CreateMockStream>;

// jsdom has no structuredClone; the mock snapshots its state with it so a
// reverted write rolls back.
globalThis.structuredClone ??= <T,>(value: T): T =>
  deserialize(serialize(value)) as T;

const mockWorld: { current: MockStream | null } = { current: null };
const mockPath = { current: "/stream" };

jest.mock("next/navigation", () => ({
  usePathname: () => mockPath.current,
}));

// The provider builds one world per tab; freeze its wall clock so only the
// tests move simulated time, and keep a handle for setup.
jest.mock("@/lib/stream/mock", () => {
  const actual =
    jest.requireActual<typeof import("@/lib/stream/mock")>("@/lib/stream/mock");
  return {
    ...actual,
    createMockStream: () => {
      const stream = actual.createMockStream({ wallNow: () => 0 });
      mockWorld.current = stream;
      return stream;
    },
  };
});

function world(): MockStream {
  if (mockWorld.current === null) {
    throw new Error("the provider has not built the mock yet");
  }
  return mockWorld.current;
}

/** The key of the seeded token with this title and variant. */
function keyOf(title: string, variant: WorkVariant): string {
  for (const token of world().engine.state.tokens.values()) {
    const master =
      token.linked.master === null
        ? token
        : world().engine.state.tokens.get(token.linked.master);
    const name = token.standard === "ERC1155" ? master?.title : token.title;
    if (name === title && token.variant === variant) {
      return token.key;
    }
  }
  throw new Error(`no ${variant} titled ${title}`);
}

/** Switches the connected account, as the dev panel's account picker does. */
function AccountSwitch({ account }: { readonly account: Address | null }) {
  const { setAccount } = useStream();
  return (
    <button type="button" onClick={() => setAccount(account)}>
      Use this account
    </button>
  );
}

function renderInSection(children: ReactNode, account?: Address | null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <StreamProvider>
        {account === undefined ? null : <AccountSwitch account={account} />}
        {children}
      </StreamProvider>
    </QueryClientProvider>
  );
}

/** Renders the work page once the provider's world exists. */
async function showWork(
  find: () => string,
  account?: Address | null
): Promise<string> {
  function Page() {
    const { client } = useStream();
    return client === null ? null : <WorkPage workKey={find()} />;
  }
  renderInSection(<Page />, account);
  if (account !== undefined) {
    fireEvent.click(screen.getByRole("button", { name: "Use this account" }));
  }
  const key = find();
  const title = world().engine.state.tokens.get(key)?.title ?? "";
  await screen.findByRole("heading", { level: 1 });
  return title;
}

/** The value cell of a facts-table row. */
async function fact(label: string): Promise<HTMLElement> {
  const header = await screen.findByRole("rowheader", { name: label });
  const row = header.closest("tr");
  if (row === null) {
    throw new Error(`no row ${label}`);
  }
  return within(row).getByRole("cell");
}

beforeEach(() => {
  mockPath.current = "/stream";
  mockWorld.current?.dev.reset();
});

describe("the work page variants", () => {
  it("shows a sold canonical 1/1 with its facts and outcome", async () => {
    await showWork(() => keyOf("Salt Meridian", "stream-1of1"));
    expect(await fact("What it is")).toHaveTextContent(
      "A 6529 Stream 1/1 (ERC-721)"
    );
    expect(await fact("Issued by")).toHaveTextContent(
      "6529 Stream, after a network vote"
    );
    expect(await fact("License")).toHaveTextContent("CC0-1.0Irrevocable");
    expect(await fact("Storage")).toHaveTextContent("On-chain");
    expect(await fact("Primary sale")).toHaveTextContent(
      "75% artist side · 25% network"
    );
    expect(await fact("Royalty")).toHaveTextContent("6.529% of resales");
    expect(await fact("Dispute statement")).not.toHaveTextContent("None");
    expect(await screen.findByText(/^Sold to/)).toBeInTheDocument();
    expect(screen.getByText("Delivered at settlement.")).toBeInTheDocument();
    expect(screen.getAllByText("Won").length).toBeGreaterThan(0);
  });

  it("shows a 6529 Stream Editions edition linked to its master", async () => {
    await showWork(() => keyOf("Ember Index", "stream-edition"));
    expect(await fact("What it is")).toHaveTextContent(
      "An edition in 6529 Stream Editions (ERC-1155)"
    );
    const linked = await fact("Linked");
    expect(linked).toHaveTextContent("Edition of");
    expect(within(linked).getByRole("link")).toHaveTextContent(
      "6529 Stream · 1/1 #3"
    );
    expect(await fact("Supply")).toHaveTextContent(/sold · \d+ claimed/);
    expect(await screen.findByLabelText("The 1/1")).toBeInTheDocument();
  });

  it("shows a federated 721 that went back to its artist", async () => {
    await showWork(() => keyOf("Ferry Light", "federated-721"));
    expect(await fact("Issued by")).toHaveTextContent(
      "Artist-owned contract, not curated by the network"
    );
    expect(await fact("Contract")).toHaveTextContent("Halden Studio (HALDEN)");
    expect(await fact("Primary sale")).toHaveTextContent(
      "90% artist side · 10% network"
    );
    expect(
      await screen.findByText("The work went back to its artist.")
    ).toBeInTheDocument();
  });

  it("shows a standalone federated 1155 with its supply and cap", async () => {
    await showWork(() => keyOf("Grain 01", "federated-1155"));
    expect(await fact("What it is")).toHaveTextContent(
      "A federated edition (ERC-1155) in the artist's contract"
    );
    expect(await fact("Linked")).toHaveTextContent("None");
    expect(await fact("Cap")).toHaveTextContent("No cap");
    expect(await fact("License")).toHaveTextContent("CC-BY-4.0");
  });

  it("shows both halves of a federated pair, linked to each other", async () => {
    await showWork(() => keyOf("Two Rooms", "federated-pair-master"));
    expect(await fact("What it is")).toHaveTextContent(
      "The 1/1 half of a federated pair (ERC-721)"
    );
    expect(await fact("Linked")).toHaveTextContent(
      "Its editionsFederated pair · editions #1"
    );
    expect(await fact("License")).toHaveTextContent(
      "LicenseRef-Ohm-Studio-1.0Custom text, stored with the record"
    );
  });

  it("shows the editions half of a federated pair", async () => {
    await showWork(() => keyOf("Two Rooms", "federated-pair-edition"));
    expect(await fact("What it is")).toHaveTextContent(
      "The editions half of a federated pair (ERC-1155)"
    );
    expect(await fact("Linked")).toHaveTextContent(
      "Edition ofFederated pair · 1/1 #1"
    );
  });

  it("renders an unknown sale method as unsupported", async () => {
    await showWork(() => keyOf("Quiet Engine", "stream-1of1"));
    const token = world().engine.token(keyOf("Quiet Engine", "stream-1of1"));
    act(() => {
      token.sale = {
        kind: "FIXED_PRICE",
        adapter: token.token,
        saleId: "0x01",
      };
      world().engine.notify();
    });
    expect(
      await screen.findByText(
        "This sale method (FIXED_PRICE) isn't shown here yet."
      )
    ).toBeInTheDocument();
    expect(await fact("Sale")).toHaveTextContent(
      "FIXED_PRICE (not shown in this version)"
    );
  });
});

describe("the 1/1 English auction panel", () => {
  it("places a bid above the minimum and leads", async () => {
    await showWork(
      () => keyOf("Quiet Engine", "stream-1of1"),
      MOCK_ACCOUNTS.collectorB
    );
    expect(
      await screen.findByText(
        "A bid in the last 15 minutes moves the end to 15 minutes after it."
      )
    ).toBeInTheDocument();
    expect(await fact("Editions close")).toHaveTextContent(
      "15 min after the 1/1's final end"
    );
    const input = screen.getByLabelText("Your bid in ETH");
    expect(input).toHaveValue("0.21");
    expect(screen.getByText("The minimum is 0.21 ETH.")).toBeVisible();
    fireEvent.change(input, { target: { value: "0.2" } });
    expect(screen.getByText("Too low: the minimum is 0.21 ETH.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Place bid" })).toBeDisabled();
    fireEvent.change(input, { target: { value: "0.25" } });
    fireEvent.click(screen.getByRole("button", { name: "Place bid" }));
    expect(await screen.findByText("Done.")).toBeInTheDocument();
    expect(
      await screen.findByText("You're the high bidder.")
    ).toBeInTheDocument();
    expect(screen.getAllByText("Leading").length).toBe(1);
  });

  it("shows an anti-snipe extension in the times and the history", async () => {
    await showWork(() => keyOf("Fold Study 7", "stream-1of1"));
    expect(await fact("End")).toHaveTextContent("Moved by late bids");
    expect(screen.getByText(/^Moved the end to/)).toBeInTheDocument();
  });

  it("settles an unbid canonical 1/1 into the museum", async () => {
    await showWork(() => keyOf("Night Tide", "stream-1of1"));
    expect(
      await screen.findByText(
        "No bids. Settling sends the work to the 6529 Network Museum."
      )
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Settle" }));
    expect(
      await screen.findByText("The work went to the 6529 Network Museum.")
    ).toBeInTheDocument();
    expect(await fact("Owner")).toHaveTextContent("6529 Network Museum");
  });

  it("lets a winner whose wallet refused the token claim it", async () => {
    await showWork(
      () => keyOf("Ember Index", "stream-1of1"),
      MOCK_ACCOUNTS.collectorB
    );
    expect(
      await screen.findByText("The winner's wallet refused the token.")
    ).toBeInTheDocument();
    expect(await fact("Owner")).toHaveTextContent("Pending delivery to");
    fireEvent.click(
      await screen.findByRole("button", { name: "Claim delivery" })
    );
    expect(await screen.findByText("Done.")).toBeInTheDocument();
    await waitFor(async () =>
      expect(await fact("Owner")).not.toHaveTextContent("Pending delivery")
    );
    expect(await fact("Owner")).toHaveTextContent("You (Collector B)");
  });

  it("lets the high bidder withdraw while a dispute pauses the auction", async () => {
    await showWork(
      () => keyOf("Glass Orchard", "stream-1of1"),
      MOCK_ACCOUNTS.collectorB
    );
    expect(await screen.findByText("Paused for a dispute")).toBeInTheDocument();
    expect(
      await screen.findByText(
        "Edition bidding continues, and edition bidders can withdraw."
      )
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Withdraw my bid" }));
    expect(
      await screen.findByText(/^The high bid was withdrawn/)
    ).toBeInTheDocument();
    expect(screen.getByText(/^Your credits:/)).toBeInTheDocument();
    expect(screen.getAllByText("Bid withdrawn").length).toBeGreaterThan(0);
  });

  it("shows an upheld dispute: cancelled, burned, editions void", async () => {
    await showWork(() => keyOf("Withdrawn Light", "stream-1of1"));
    expect(
      await screen.findByText("Dispute upheld: sale cancelled, token burned")
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        "The edition auction is void. Every edition bid is refunded in full."
      )
    ).toBeInTheDocument();
    expect(await fact("Owner")).toHaveTextContent("None: burned");
  });

  it("refuses bids on a delisted contract and says how settling ends", async () => {
    await showWork(() => keyOf("Untitled (after Mara Vell)", "federated-721"));
    expect(
      await screen.findByText(
        "The contract is delisted. Settling refunds the high bid and returns the work to its artist."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Delisted")).toBeInTheDocument();
  });
});

describe("the dev-panel work controls", () => {
  it("resolves a dispute only after the decision delay, then resumes", async () => {
    function Controls() {
      const { client } = useStream();
      return client?.dev ? (
        <DevWorkControls dev={client.dev} locale="en-US" />
      ) : null;
    }
    renderInSection(<Controls />);
    await waitFor(() => expect(mockWorld.current).not.toBeNull());
    const key = keyOf("Glass Orchard", "stream-1of1");
    mockPath.current = `/stream/works/${key}`;
    await act(async () => {
      world().dev.advance(0);
    });
    fireEvent.click(
      await screen.findByRole("button", { name: "Vote: reject" })
    );
    expect(
      await screen.findByText("Too early: wait 48 hours after the pause.")
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Skip to decision time" })
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Vote: reject" })
    );
    expect(await screen.findByText("Done.")).toBeInTheDocument();
    const auction = await world().dataSource.auctionForWork(key);
    expect(auction?.state).toBe("ACTIVE");
    expect(auction?.pause.used).toBe(true);
  });

  it("delists and relists a federated contract", async () => {
    function Controls() {
      const { client } = useStream();
      return client?.dev ? (
        <DevWorkControls dev={client.dev} locale="en-US" />
      ) : null;
    }
    renderInSection(<Controls />);
    await waitFor(() => expect(mockWorld.current).not.toBeNull());
    const key = keyOf("Ferry Light", "federated-721");
    const contract = world().engine.token(key).federatedContract;
    mockPath.current = `/stream/federated/${contract}`;
    await act(async () => {
      world().dev.advance(0);
    });
    fireEvent.click(
      await screen.findByRole("button", { name: "Vote: delist contract" })
    );
    expect(
      await screen.findByRole("button", { name: "Vote: relist contract" })
    ).toBeInTheDocument();
    expect((await world().dataSource.getWork(key))?.federated?.status).toBe(
      "DELISTED"
    );
  });
});
