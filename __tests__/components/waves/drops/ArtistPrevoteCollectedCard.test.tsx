import { useAuth } from "@/components/auth/Auth";
import { ArtistPrevoteCollectedCard } from "@/components/waves/drops/ArtistPrevoteCollectedCard";
import type { CollectedCard } from "@/entities/IProfile";
import { CollectedCollectionType } from "@/entities/IProfile";
import { useNftBalance } from "@/hooks/useNftBalance";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/components/auth/Auth");
jest.mock("@/hooks/useNftBalance");

const mockUserPageCollectedCard = jest.fn(
  ({ card }: { card: CollectedCard }) => (
    <div data-testid="user-page-collected-card">
      seized:{String(card.seized_count)}
    </div>
  )
);

jest.mock("@/components/user/collected/cards/UserPageCollectedCard", () => ({
  __esModule: true,
  default: (props: { card: CollectedCard }) => mockUserPageCollectedCard(props),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseNftBalance = useNftBalance as jest.MockedFunction<
  typeof useNftBalance
>;

const baseCard: CollectedCard = {
  collection: CollectedCollectionType.MEMES,
  token_id: 136,
  token_name: "Abduction of Satoshi, 2023",
  img: "https://example.com/meme.png",
  tdh: 1234,
  rank: 20,
  seized_count: null,
  szn: null,
};

describe("ArtistPrevoteCollectedCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      connectedProfile: {
        consolidation_key: "consolidation-key-1",
      },
    } as any);

    mockUseNftBalance.mockReturnValue({
      balance: 3,
      isLoading: false,
      error: null,
    });
  });

  it("does not render the bottom 'You own n' text", () => {
    render(<ArtistPrevoteCollectedCard card={baseCard} />);

    expect(screen.queryByText(/you own/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("user-page-collected-card")).toHaveTextContent(
      "seized:3"
    );
  });

  it("passes null seized_count while balance is loading", () => {
    mockUseNftBalance.mockReturnValue({
      balance: 3,
      isLoading: true,
      error: null,
    });

    render(<ArtistPrevoteCollectedCard card={baseCard} />);

    expect(screen.getByTestId("user-page-collected-card")).toHaveTextContent(
      "seized:null"
    );
    expect(mockUserPageCollectedCard).toHaveBeenCalledWith(
      expect.objectContaining({
        showZeroSeizedCount: false,
      })
    );
  });

  it("uses null consolidationKey and keeps seized_count null without connected profile", () => {
    mockUseAuth.mockReturnValue({
      connectedProfile: null,
    } as any);

    render(<ArtistPrevoteCollectedCard card={baseCard} />);

    expect(mockUseNftBalance).toHaveBeenCalledWith(
      expect.objectContaining({
        consolidationKey: null,
        tokenId: 136,
      })
    );
    expect(screen.getByTestId("user-page-collected-card")).toHaveTextContent(
      "seized:null"
    );
  });
});
