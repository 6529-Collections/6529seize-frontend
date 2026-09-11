import NftMarketActivity from "@/components/nft-market-activity/NftMarketActivity";
import { getNextGenImageUrl } from "@/components/nextGen/collections/nextgenToken/NextGenTokenImage";
import { MEMES_CONTRACT, NEXTGEN_CONTRACT } from "@/constants/constants";
import { useNFTCollections } from "@/hooks/useNFTCollections";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";

jest.mock("@/services/api/common-api");
jest.mock("@/hooks/useNFTCollections");
jest.mock("@/components/address/Address", () => ({
  __esModule: true,
  default: ({ wallets, display }: { wallets: string[]; display?: string }) => (
    <a href={`/${wallets[0]}`}>{display ?? wallets[0]}</a>
  ),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

const mockFetch = commonApiFetch as jest.MockedFunction<typeof commonApiFetch>;
const mockCollections = useNFTCollections as jest.MockedFunction<
  typeof useNFTCollections
>;
const MAKER = "0x1111111111111111111111111111111111111111";
const TAKER = "0x2222222222222222222222222222222222222222";

function renderFeed(
  props: React.ComponentProps<typeof NftMarketActivity> = {}
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NftMarketActivity {...props} />
    </QueryClientProvider>
  );
}

function marketEvent(overrides: Record<string, unknown> = {}) {
  return {
    event_id: "market-1",
    kind: "market",
    action: "cancellation",
    occurred_at: "2026-09-10T00:00:00Z",
    observed_at: "2026-09-10T00:01:00Z",
    source: "opensea",
    evidence: "provider_event",
    contract: MEMES_CONTRACT,
    token_id: "7",
    collection_slug: "the-memes-by-6529",
    quantity: "1",
    maker: MAKER,
    taker: null,
    price: null,
    order_id: "order-1",
    transaction_hash: null,
    ...overrides,
  };
}

describe("NftMarketActivity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCollections.mockReturnValue({
      nfts: [
        {
          id: 7,
          contract: MEMES_CONTRACT,
          name: "Seize the Memes of Production",
          thumbnail: "https://example.test/7.png",
        } as never,
      ],
      nextgenCollections: [],
      loading: false,
    });
  });

  it("renders an off-chain cancellation with linked NFT metadata", async () => {
    mockFetch.mockResolvedValueOnce({
      data: [marketEvent()],
      next: null,
      market_history_started_at: "2026-09-01T00:00:00Z",
      notes: [],
    });

    renderFeed({
      contract: MEMES_CONTRACT,
      tokenId: "7",
      filter: "cancellations",
    });

    expect(await screen.findByText("Cancelled")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Seize the Memes of Production" })
    ).toHaveAttribute("href", "/the-memes/7");
    expect(
      screen.getByRole("columnheader", { name: "Total" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Not available")).toHaveLength(2);
    expect(
      screen.queryByRole("link", { name: /Etherscan/i })
    ).not.toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "nft-activity",
        includeWalletAuth: false,
        params: expect.objectContaining({
          contract: MEMES_CONTRACT,
          token_id: "7",
          filter: "cancellations",
        }),
      })
    );
  });

  it("labels total amounts, filled orders, provider statuses, recipients, and ENS", async () => {
    mockFetch.mockResolvedValueOnce({
      data: [
        marketEvent({
          event_id: "filled-1",
          action: "fulfilled",
          evidence: "provider_order_status",
          taker: TAKER,
          price: "2.500000000000000001",
          currency: {
            address: "0x3333333333333333333333333333333333333333",
            symbol: "WETH",
            decimals: 18,
          },
          transaction_hash: `0x${"a".repeat(64)}`,
          transaction_details: {
            from_display: "maker.eth",
            to_display: "recipient.eth",
          },
        }),
      ],
      next: null,
      market_history_started_at: null,
      notes: [],
    });

    renderFeed();

    expect(await screen.findByText("Order filled")).toBeInTheDocument();
    expect(
      screen.getByText("Confirmed by provider status")
    ).toBeInTheDocument();
    expect(screen.getByText("2.500000000000000001 WETH")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "maker.eth" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "recipient.eth" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Etherscan/i })).toHaveAttribute(
      "href",
      `https://etherscan.io/tx/0x${"a".repeat(64)}`
    );
  });

  it("localizes unknown actions and keeps exact prices and invalid dates safe", async () => {
    mockFetch.mockResolvedValueOnce({
      data: [
        marketEvent({
          event_id: "provider-action-1",
          action: "provider_custom",
          occurred_at: "not-a-date",
          price: "12345678901234567890.000000000000000001",
          currency: {
            address: "0x3333333333333333333333333333333333333333",
            symbol: "ETH",
            decimals: 18,
          },
        }),
      ],
      next: null,
      market_history_started_at: null,
      notes: [],
    });

    renderFeed({ locale: "en-US" });

    expect(
      await screen.findByText("Unknown action (provider_custom)")
    ).toBeInTheDocument();
    expect(
      screen.getByText("12,345,678,901,234,567,890.000000000000000001 ETH")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("row", { name: /Unknown action/ }).querySelector("time")
    ).toBeNull();
  });

  it("uses an explicitly supplied route locale for activity values", async () => {
    mockFetch.mockResolvedValueOnce({
      data: [
        marketEvent({
          event_id: "localized-price-1",
          price: "1234.5",
          currency: {
            address: "0x3333333333333333333333333333333333333333",
            symbol: "ETH",
            decimals: 18,
          },
        }),
      ],
      next: null,
      market_history_started_at: null,
      notes: [],
    });

    renderFeed({ locale: "de-DE" });

    expect(await screen.findByText("1.234,5 ETH")).toBeInTheDocument();
  });

  it("keeps the full NextGen on-chain id in the provenance link", async () => {
    const fullTokenId = "10000000007";
    mockFetch.mockResolvedValueOnce({
      data: [
        marketEvent({
          event_id: "nextgen-token-1",
          contract: NEXTGEN_CONTRACT,
          token_id: fullTokenId,
        }),
      ],
      next: null,
      market_history_started_at: null,
      notes: [],
    });

    renderFeed({ locale: "en-US" });

    expect(
      await screen.findByRole("link", { name: "NextGen #7" })
    ).toHaveAttribute("href", `/nextgen/token/${fullTokenId}/provenance`);
  });

  it("keeps a persistent live status node across loading and empty states", async () => {
    let resolvePending: ((page: unknown) => void) | undefined;
    const pending = new Promise<unknown>((resolve) => {
      resolvePending = resolve;
    });
    mockFetch.mockReturnValueOnce(pending as Promise<never>);

    renderFeed({ locale: "en-US" });
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Loading NFT activity…");

    resolvePending?.({
      data: [],
      next: null,
      market_history_started_at: null,
      notes: [],
    });
    expect(await screen.findAllByText("No NFT activity found.")).toHaveLength(
      2
    );
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent("No NFT activity found.");
  });

  it("distinguishes airdrops and elapsed expirations", async () => {
    mockFetch.mockResolvedValueOnce({
      data: [
        marketEvent({
          event_id: "airdrop-1",
          kind: "transaction",
          action: "mint",
          evidence: "chain",
          price: "0",
        }),
        marketEvent({
          event_id: "expiry-1",
          action: "expiration",
          evidence: "elapsed_expiry",
        }),
      ],
      next: null,
      market_history_started_at: null,
      notes: [],
    });

    renderFeed();

    expect(await screen.findByText("Airdropped")).toBeInTheDocument();
    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(
      screen.getByText("Expired at the stated order time")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Scrollable NFT activity table" })
    ).toHaveAttribute("tabindex", "0");
  });

  it("loads cursor pages and de-duplicates stable event IDs", async () => {
    mockFetch
      .mockResolvedValueOnce({
        data: [marketEvent({ event_id: "one", action: "transfer" })],
        next: "cursor-2",
        market_history_started_at: null,
        notes: [],
      })
      .mockResolvedValueOnce({
        data: [
          marketEvent({ event_id: "one", action: "transfer" }),
          marketEvent({ event_id: "two", action: "listing" }),
        ],
        next: null,
        market_history_started_at: null,
        notes: [],
      });

    renderFeed({ pageSize: 1 });
    expect(await screen.findByText("Transferred")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Load more" }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    expect(screen.getAllByText("Transferred")).toHaveLength(1);
    expect(await screen.findByText("Listed")).toBeInTheDocument();
    expect(mockFetch.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        params: expect.objectContaining({ cursor: "cursor-2" }),
      })
    );
  });

  it.each([MEMES_CONTRACT, NEXTGEN_CONTRACT])(
    "hides failed decorative images after the available fallback for %s",
    async (contract) => {
      const tokenId = contract === NEXTGEN_CONTRACT ? "10000000000" : "7";
      mockFetch.mockResolvedValueOnce({
        data: [marketEvent({ contract, token_id: tokenId })],
        next: null,
        market_history_started_at: null,
        notes: [],
      });
      const { container } = renderFeed();
      await screen.findByText("Cancelled");
      const thumbnail = container.querySelector("img");
      expect(thumbnail).not.toBeNull();
      fireEvent.error(thumbnail!);
      if (contract === NEXTGEN_CONTRACT) {
        expect(thumbnail).toHaveAttribute(
          "src",
          getNextGenImageUrl(Number(tokenId))
        );
        expect(thumbnail).not.toHaveAttribute("hidden");
        fireEvent.error(thumbnail!);
      }
      expect(thumbnail).toHaveAttribute("hidden");
      expect(screen.getByText("Cancelled")).toBeVisible();
    }
  );

  it("handles NextGen collections without an OpenSea link", async () => {
    mockCollections.mockReturnValue({
      nfts: [],
      nextgenCollections: [
        {
          id: 1,
          name: "Pebbles",
          opensea_link: null,
        } as never,
      ],
      loading: false,
    });
    mockFetch.mockResolvedValueOnce({
      data: [
        marketEvent({
          event_id: "nextgen-collection-offer",
          contract: NEXTGEN_CONTRACT,
          token_id: null,
          collection_slug: "pebbles-by-zeblocks",
        }),
      ],
      next: null,
      market_history_started_at: null,
      notes: [],
    });

    renderFeed();

    expect(await screen.findByText("NextGen")).toBeInTheDocument();
    expect(
      screen.getByText("Collection-level order · card eligibility varies")
    ).toBeInTheDocument();
  });
});
