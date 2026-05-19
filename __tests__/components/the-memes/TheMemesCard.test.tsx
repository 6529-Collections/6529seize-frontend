jest.mock("@/components/nft-image/NFTImage", () => ({
  __esModule: true,
  default: jest.fn(
    ({
      nft,
      showBalance,
    }: {
      readonly nft: { readonly id: number };
      readonly showBalance: boolean;
    }) => (
      <div
        data-testid="nft-image"
        data-id={nft.id}
        data-show-balance={showBalance}
      />
    )
  ),
}));

jest.mock("@/components/nft-image/NFTImageBalance", () => ({
  __esModule: true,
  default: jest.fn(
    ({
      contract,
      tokenId,
      inline,
    }: {
      readonly contract: string;
      readonly tokenId: number;
      readonly inline?: boolean | undefined;
    }) => (
      <span
        data-testid="nft-balance"
        data-contract={contract}
        data-token-id={tokenId}
        data-inline={inline}
      >
        UNSEIZED
      </span>
    )
  ),
}));

jest.mock("@/components/drops/media/MediaTypeBadge", () => ({
  __esModule: true,
  default: ({ mimeType }: { readonly mimeType: string }) => (
    <span data-testid="media-type">{mimeType}</span>
  ),
}));

import NFTImage from "@/components/nft-image/NFTImage";
import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import TheMemesCard from "@/components/the-memes/TheMemesCard";
import { VolumeType, type NFTWithMemesExtendedData } from "@/entities/INFT";
import { MemesSort } from "@/types/enums";
import { render, screen } from "@testing-library/react";

const mockNFTImage = jest.mocked(NFTImage);
const mockNFTImageBalance = jest.mocked(NFTImageBalance);

const nft: NFTWithMemesExtendedData = {
  id: 6529,
  contract: "0xmemes",
  created_at: new Date("2024-01-01T00:00:00.000Z"),
  mint_date: new Date("2024-01-02T00:00:00.000Z"),
  mint_price: 0.06529,
  supply: 1000,
  name: "Test Meme",
  collection: "The Memes",
  token_type: "ERC1155",
  description: "Test description",
  artist: "Artist",
  artist_seize_handle: "artist",
  uri: "ipfs://metadata",
  icon: "https://example.com/icon.jpg",
  thumbnail: "https://example.com/thumb.jpg",
  scaled: "https://example.com/scaled.jpg",
  image: "https://example.com/image.jpg",
  animation: "",
  metadata: {
    image: "https://example.com/image.jpg",
  },
  market_cap: 10,
  floor_price: 0.5,
  total_volume_last_24_hours: 1,
  total_volume_last_7_days: 2,
  total_volume_last_1_month: 3,
  total_volume: 4,
  highest_offer: 0.4,
  boosted_tdh: 1234,
  tdh: 1000,
  tdh__raw: 1000,
  tdh_rank: 1,
  hodl_rate: 0.5,
  collection_size: 1000,
  edition_size: 1000,
  edition_size_rank: 1,
  museum_holdings: 0,
  museum_holdings_rank: 0,
  edition_size_cleaned: 1000,
  edition_size_cleaned_rank: 1,
  hodlers: 500,
  hodlers_rank: 1,
  percent_unique: 0.5,
  percent_unique_rank: 1,
  percent_unique_cleaned: 0.45,
  percent_unique_cleaned_rank: 1,
  burnt: 0,
  edition_size_not_burnt: 1000,
  edition_size_not_burnt_rank: 1,
  percent_unique_not_burnt: 0.5,
  percent_unique_not_burnt_rank: 1,
  season: 1,
  meme: 1,
  meme_name: "Test Meme",
};

describe("TheMemesCard", () => {
  beforeEach(() => {
    mockNFTImage.mockClear();
    mockNFTImageBalance.mockClear();
  });

  it("keeps the card link, artwork, media badge, title, and sort metric", () => {
    render(
      <TheMemesCard
        nft={nft}
        sort={MemesSort.EDITION_SIZE}
        volumeType={VolumeType.ALL_TIME}
        hasConnectedProfile={false}
      />
    );

    expect(screen.getByRole("link")).toHaveAttribute("href", "/the-memes/6529");
    expect(screen.getByTestId("nft-image")).toHaveAttribute("data-id", "6529");
    expect(screen.getByTestId("nft-image")).toHaveAttribute(
      "data-show-balance",
      "false"
    );
    expect(screen.getByTestId("media-type")).toHaveTextContent("image/jpeg");
    expect(screen.getByText("#6529 - Test Meme")).toBeInTheDocument();
    expect(screen.getByText("Edition Size: 1,000")).toBeInTheDocument();
    expect(screen.queryByTestId("nft-balance")).not.toBeInTheDocument();
  });

  it("renders connected balance with the separate meme view inline pill styling", () => {
    render(
      <TheMemesCard
        nft={nft}
        sort={MemesSort.AGE}
        volumeType={VolumeType.ALL_TIME}
        hasConnectedProfile={true}
      />
    );

    const balance = screen.getByTestId("nft-balance");
    expect(balance).toHaveAttribute("data-contract", "0xmemes");
    expect(balance).toHaveAttribute("data-token-id", "6529");
    expect(balance).toHaveAttribute("data-inline", "true");
    expect(balance.parentElement).toHaveClass(
      "tw-rounded-md",
      "tw-border-iron-800",
      "tw-bg-transparent",
      "tw-text-iron-400"
    );
    expect(balance.parentElement?.className).toContain(
      "[&>span]:tw-text-[0.65625rem]"
    );
  });
});
