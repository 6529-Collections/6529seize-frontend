import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ArtistWinningArtworksContent } from "@/components/waves/drops/ArtistWinningArtworksContent";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { useUserPrevoteCards } from "@/hooks/useUserPrevoteCards";
import { useUserWinningArtworks } from "@/hooks/useUserWinningArtworks";

jest.mock("@/hooks/useUserWinningArtworks", () => ({
  useUserWinningArtworks: jest.fn(),
}));

jest.mock("@/hooks/useUserPrevoteCards", () => ({
  useUserPrevoteCards: jest.fn(),
}));

jest.mock("@/helpers/waves/drop.helpers", () => ({
  convertApiDropToExtendedDrop: (drop: unknown) => drop,
}));

jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

jest.mock("react-tooltip", () => ({
  Tooltip: () => null,
}));

jest.mock("@/components/drops/view/item/content/media/MediaDisplay", () => ({
  __esModule: true,
  default: () => <div data-testid="media-display" />,
}));

jest.mock("@/components/waves/drops/ArtistPrevoteCollectedCard", () => ({
  ArtistPrevoteCollectedCard: ({ card }: { card: { token_name: string } }) => (
    <div data-testid="artist-prevote-card">{card.token_name}</div>
  ),
}));

const mockUseUserWinningArtworks =
  useUserWinningArtworks as jest.MockedFunction<typeof useUserWinningArtworks>;
const mockUseUserPrevoteCards = useUserPrevoteCards as jest.MockedFunction<
  typeof useUserPrevoteCards
>;

const mockWinningDrop = {
  id: "drop-1",
  title: "Winner #1",
  rating: 12345,
  wave: {
    voting_credit_type: "TDH",
  },
  top_raters: [
    {
      profile: {
        handle: "voter-1",
        pfp: null,
      },
      rating: 456,
    },
  ],
  raters_count: 1,
  created_at: 1710000000000,
  winning_context: {
    decision_time: 1710000001000,
  },
  parts: [
    {
      media: [
        {
          url: "https://example.com/winner.png",
          mime_type: "image/png",
        },
      ],
      content: "",
    },
  ],
};

const mockPrevoteCard = {
  collection: "MEMES",
  token_id: 99,
  token_name: "Prevote Card #99",
  img: "https://example.com/prevote.png",
  tdh: 100,
  rank: 10,
  seized_count: null,
  szn: null,
};

describe("ArtistWinningArtworksContent", () => {
  const mockUser = {
    id: "user-1",
    handle: "artist",
    pfp: null,
    level: 1,
    cic: 0,
    rep: 0,
  } as ApiProfileMin;

  const defaultProps = {
    user: mockUser,
    isOpen: true,
    onDropClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserWinningArtworks.mockReturnValue({
      winningDrops: [mockWinningDrop],
      isLoading: false,
      isError: false,
      winnerDropIds: ["drop-1"],
    });
    mockUseUserPrevoteCards.mockReturnValue({
      prevoteCards: [mockPrevoteCard],
      prevoteCardIds: [99],
      isLoading: false,
      isError: false,
    });
  });

  it("renders a mixed grid with winners first and prevote cards after", () => {
    render(<ArtistWinningArtworksContent {...defaultProps} />);

    expect(screen.queryByText(/Main Stage Winners:/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Artist of Prevote Cards:/)
    ).not.toBeInTheDocument();

    const trophyItems = screen.getAllByTestId(/trophy-item-/);
    expect(trophyItems).toHaveLength(2);
    expect(trophyItems[0]).toHaveAttribute("data-testid", "trophy-item-winner");
    expect(trophyItems[1]).toHaveAttribute(
      "data-testid",
      "trophy-item-prevote"
    );

    expect(screen.queryByText("Main Stage Winner")).not.toBeInTheDocument();
    expect(screen.queryByText("Artist of Prevote")).not.toBeInTheDocument();
    expect(screen.getByTestId("artist-prevote-card")).toBeInTheDocument();
  });

  it("shows loading state while either source is loading", () => {
    mockUseUserWinningArtworks.mockReturnValue({
      winningDrops: [],
      isLoading: true,
      isError: false,
      winnerDropIds: [],
    });
    mockUseUserPrevoteCards.mockReturnValue({
      prevoteCards: [],
      prevoteCardIds: [],
      isLoading: false,
      isError: false,
    });

    render(<ArtistWinningArtworksContent {...defaultProps} />);

    expect(
      screen.getByText("Loading minted memes...", { selector: "span" })
    ).toBeInTheDocument();
  });

  it("shows empty state when there are no minted memes", () => {
    mockUseUserWinningArtworks.mockReturnValue({
      winningDrops: [],
      isLoading: false,
      isError: false,
      winnerDropIds: [],
    });
    mockUseUserPrevoteCards.mockReturnValue({
      prevoteCards: [],
      prevoteCardIds: [],
      isLoading: false,
      isError: false,
    });

    render(<ArtistWinningArtworksContent {...defaultProps} />);

    expect(screen.getByText("No minted memes found.")).toBeInTheDocument();
    expect(screen.queryByText(/Main Stage Winners:/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Artist of Prevote Cards:/)
    ).not.toBeInTheDocument();
  });
});
