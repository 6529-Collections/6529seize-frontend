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
      size,
      variant,
    }: {
      readonly contract: string;
      readonly tokenId: number;
      readonly inline?: boolean | undefined;
      readonly size?: string | undefined;
      readonly variant?: string | undefined;
    }) => (
      <span
        data-testid="nft-balance"
        data-contract={contract}
        data-token-id={tokenId}
        data-inline={inline}
        data-size={size}
        data-variant={variant}
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
import { formatDate } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
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

    expect(
      screen.getByRole("link", { name: "View Test Meme, card #6,529" })
    ).toHaveAttribute("href", "/the-memes/6529");
    expect(screen.getByTestId("nft-image")).toHaveAttribute("data-id", "6529");
    expect(screen.getByTestId("nft-image")).toHaveAttribute(
      "data-show-balance",
      "false"
    );
    const title = screen.getByText("Test Meme");
    const token = screen.getByText("#6529");
    const tokenBadge = token.parentElement;
    expect(tokenBadge).toBeInTheDocument();
    expect(tokenBadge).not.toHaveClass("tw-absolute");
    expect(tokenBadge).not.toHaveClass("tw-border", "tw-rounded-md");
    expect(tokenBadge).toHaveClass(
      "tw-inline-flex",
      "tw-text-xs",
      "tw-text-iron-500"
    );
    expect(tokenBadge?.parentElement).toHaveClass("tw-justify-center");
    expect(tokenBadge?.parentElement).not.toHaveClass("tw-ml-auto");
    expect(screen.getByTestId("media-type")).toHaveTextContent("image/jpeg");
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass(
      "tw-text-sm",
      "md:tw-text-md",
      "tw-text-iron-50",
      "tw-text-center"
    );
    expect(
      Boolean(
        title.compareDocumentPosition(token) & Node.DOCUMENT_POSITION_FOLLOWING
      )
    ).toBe(true);
    expect(screen.queryByText("#6529 - Test Meme")).not.toBeInTheDocument();
    expect(title).not.toContainElement(screen.getByTestId("media-type"));
    const metricLabel = screen.getByText("Edition Size:");
    expect(metricLabel.parentElement).toHaveTextContent("Edition Size: 1,000");
    expect(metricLabel).toHaveClass("tw-text-iron-500");
    expect(screen.getByText("1,000")).toHaveClass("tw-text-iron-200");
    expect(screen.queryByTestId("nft-balance")).not.toBeInTheDocument();
  });

  it("renders connected balance in the metadata row with the compact variant", () => {
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
    expect(balance).toHaveAttribute("data-variant", "compact");
    expect(balance).toHaveAttribute("data-size", "sm");
    expect(balance).not.toHaveAttribute("data-inline", "true");
    expect(balance.parentElement).toHaveClass("tw-shrink-0");
    expect(balance.parentElement?.parentElement).toHaveClass(
      "tw-justify-center",
      "tw-w-full"
    );
    expect(screen.getByText("#6529").parentElement?.parentElement).toHaveClass(
      "tw-justify-center"
    );
    expect(
      screen.getByText("#6529").parentElement?.parentElement
    ).not.toHaveClass("tw-ml-auto");
    expect(
      screen.getByText("#6529").parentElement?.parentElement?.parentElement
    ).toBe(balance.parentElement?.parentElement);

    const date = screen.getByText(
      formatDate(DEFAULT_LOCALE, nft.mint_date).replace(/\s+/g, " ").trim()
    );
    expect(date).toHaveClass("tw-w-full", "tw-text-center", "tw-text-iron-500");
    expect(date).not.toBe(
      screen.getByText("#6529").parentElement?.parentElement
    );
  });

  it("renders localized card metrics and link names when a locale is provided", () => {
    render(
      <TheMemesCard
        nft={nft}
        sort={MemesSort.EDITION_SIZE}
        volumeType={VolumeType.ALL_TIME}
        hasConnectedProfile={false}
        locale="de-DE"
      />
    );

    expect(
      screen.getByRole("link", { name: "Test Meme, Karte #6.529 ansehen" })
    ).toHaveAttribute("href", "/the-memes/6529?locale=de-DE");
    expect(screen.getByText("Editionsgröße:")).toBeInTheDocument();
    expect(screen.getByText("1.000")).toHaveClass("tw-text-iron-200");
  });
});
