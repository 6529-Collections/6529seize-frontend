import { SeizeConnectProvider } from "@/components/auth/SeizeConnectContext";
import {
  MemePageYourCardsRightMenu,
  MemePageYourCardsSubMenu,
} from "@/components/the-memes/MemePageYourCards";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(() => ({
    isAuthenticated: false,
    seizeConnect: jest.fn(),
    seizeAcceptConnection: jest.fn(),
    address: undefined,
    hasInitializationError: false,
    initializationError: null,
  })),
  SeizeConnectProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const mockNFT = {
  id: 123,
  name: "Test Meme",
  artist: "Test Artist",
} as any;

const mockConsolidatedTDH = {
  wallets: ["0x123"],
  balance: 5,
  tdh: 1000,
  dense_rank_balance: 10,
} as any;

const mockTransactions = [
  {
    transaction_date: new Date("2023-01-01"),
    from_address: "0x0000000000000000000000000000000000000000",
    to_address: "0x456",
    value: 0,
    token_count: 1,
  },
  {
    transaction_date: new Date("2023-01-02"),
    from_address: "0x789",
    to_address: "0x456",
    value: 1.5,
    token_count: 2,
  },
] as any[];

const renderMemePageYourCardsWithProviders = (component: React.ReactNode) => {
  const queryClient = new QueryClient();
  const mockWagmiConfig = createConfig({
    chains: [mainnet],
    transports: {
      [mainnet.id]: http(),
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={mockWagmiConfig}>
        <SeizeConnectProvider>{component}</SeizeConnectProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

describe("MemePageYourCardsRightMenu", () => {
  describe("when show is false", () => {
    it("should render empty fragment", () => {
      const { container } = render(
        <MemePageYourCardsRightMenu
          show={false}
          transactions={[]}
          wallets={[]}
          nft={undefined}
          nftBalance={0}
          myOwner={undefined}
          myTDH={undefined}
          myRank={undefined}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("when show is true", () => {
    describe("when no wallets connected", () => {
      it("should display connect wallet message", () => {
        render(
          <MemePageYourCardsRightMenu
            show={true}
            transactions={[]}
            wallets={[]}
            nft={mockNFT}
            nftBalance={0}
            myOwner={undefined}
            myTDH={undefined}
            myRank={undefined}
          />
        );
        expect(
          screen.getByText("Connect your wallet to view your cards.")
        ).toBeInTheDocument();
      });
    });

    describe("when wallets connected but no NFT balance", () => {
      it("should display no ownership message", () => {
        render(
          <MemePageYourCardsRightMenu
            show={true}
            transactions={[]}
            wallets={["0x456"]}
            nft={mockNFT}
            nftBalance={0}
            myOwner={undefined}
            myTDH={undefined}
            myRank={undefined}
          />
        );
        expect(
          screen.getByText("You don't own any editions of Card 123")
        ).toBeInTheDocument();
      });
    });

    describe("when user owns cards", () => {
      it("should display cards count and overview", () => {
        renderMemePageYourCardsWithProviders(
          <MemePageYourCardsRightMenu
            show={true}
            transactions={mockTransactions}
            wallets={["0x456"]}
            nft={mockNFT}
            nftBalance={3}
            myOwner={mockConsolidatedTDH}
            myTDH={{ tdh: 1500 } as any}
            myRank={{ rank: 5 } as any}
          />
        );

        expect(screen.getByText("x3")).toBeInTheDocument();
        expect(screen.getByText("Overview")).toBeInTheDocument();
        expect(screen.getByText("1,500")).toBeInTheDocument();
        expect(screen.getByText("#5")).toBeInTheDocument();
      });

      it("should display first acquisition date", () => {
        renderMemePageYourCardsWithProviders(
          <MemePageYourCardsRightMenu
            show={true}
            transactions={mockTransactions}
            wallets={["0x456"]}
            nft={mockNFT}
            nftBalance={3}
            myOwner={mockConsolidatedTDH}
            myTDH={undefined}
            myRank={undefined}
          />
        );

        expect(screen.getByText(/First acquired/)).toBeInTheDocument();
      });

      it("should display no TDH message when no TDH data", () => {
        renderMemePageYourCardsWithProviders(
          <MemePageYourCardsRightMenu
            show={true}
            transactions={mockTransactions}
            wallets={["0x456"]}
            nft={mockNFT}
            nftBalance={3}
            myOwner={mockConsolidatedTDH}
            myTDH={undefined}
            myRank={undefined}
          />
        );

        expect(screen.getByText("No TDH accrued")).toBeInTheDocument();
      });

      it("should categorize airdropped cards", () => {
        renderMemePageYourCardsWithProviders(
          <MemePageYourCardsRightMenu
            show={true}
            transactions={mockTransactions}
            wallets={["0x456"]}
            nft={mockNFT}
            nftBalance={3}
            myOwner={mockConsolidatedTDH}
            myTDH={undefined}
            myRank={undefined}
          />
        );

        expect(screen.getByText("1 card airdropped")).toBeInTheDocument();
      });

      it("should categorize bought cards", () => {
        renderMemePageYourCardsWithProviders(
          <MemePageYourCardsRightMenu
            show={true}
            transactions={mockTransactions}
            wallets={["0x456"]}
            nft={mockNFT}
            nftBalance={3}
            myOwner={mockConsolidatedTDH}
            myTDH={undefined}
            myRank={undefined}
          />
        );

        expect(
          screen.getByText("2 cards bought for 1.5 ETH")
        ).toBeInTheDocument();
      });
    });
  });
});

describe("MemePageYourCardsSubMenu", () => {
  describe("when show is false", () => {
    it("should render empty fragment", () => {
      const { container } = render(
        <MemePageYourCardsSubMenu show={false} transactions={[]} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("when show is true", () => {
    describe("when no transactions", () => {
      it("should not display transaction history section", () => {
        render(<MemePageYourCardsSubMenu show={true} transactions={[]} />);
        expect(
          screen.queryByText("Your Transaction History")
        ).not.toBeInTheDocument();
      });
    });

    describe("when transactions exist", () => {
      it("should display transaction history section", () => {
        const mockTxsWithFullData = mockTransactions.map((tx) => ({
          ...tx,
          gas: 21000,
          gas_price: 20000000000,
          gas_gwei: 20,
          gas_price_gwei: 20,
          contract: "0x123",
          token_id: 1,
          transaction: "0xabc",
          block: 12345678,
          created_at: new Date(),
          from_display: undefined,
          to_display: undefined,
          royalties: 0,
        }));

        render(
          <MemePageYourCardsSubMenu
            show={true}
            transactions={mockTxsWithFullData}
          />
        );
        expect(
          screen.getByText("Your Transaction History")
        ).toBeInTheDocument();
      });
    });
  });
});
