import { MemePageArt } from "@/components/the-memes/MemePageArt";
import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

jest.mock("@/components/nft-image/NFTImage", () => ({
  __esModule: true,
  default: () => <div data-testid="nft" />,
}));
jest.mock("@/components/download/Download", () => ({
  __esModule: true,
  default: () => <div data-testid="download" />,
}));
jest.mock("@/components/the-memes/ArtistProfileHandle", () => ({
  __esModule: true,
  default: () => <div data-testid="artist-handle" />,
}));
jest.mock("@/helpers/Helpers", () => ({
  enterArtFullScreen: jest.fn(),
  fullScreenSupported: () => true,
  numberWithCommas: (n: number) => String(n),
  parseNftDescriptionToHtml: (d: string) => d,
  printMintDate: (d: string) => d,
}));
jest.mock("@/helpers/nft.helpers", () => ({
  getAnimationFileTypeFromMetadata: () => "gif",
  getFileTypeFromMetadata: () => "png",
  getDimensionsFromMetadata: () => "100x100",
  getImageFileTypeFromMetadata: () => "png",
}));
jest.mock("@/components/nft-attributes/NFTAttributes", () => ({
  __esModule: true,
  default: () => <div data-testid="attrs" />,
}));

const nft = {
  id: 5,
  has_distribution: false,
  mint_price: 1,
  supply: 10,
  collection: "c",
  artist: "a",
  mint_date: "2023",
  description: "desc",
  metadata: {
    image_details: { format: "png", width: 1, height: 2 },
    animation_details: { format: "gif", width: 1, height: 2 },
    attributes: [
      { trait_type: "Type - Season", value: "S1" },
      { trait_type: "Type - Meme", value: "M1" },
      { trait_type: "Type - Card", value: "C1" },
      { trait_type: "Other", value: "val" },
      { trait_type: "Boost", value: 10, display_type: "boost_percentage" },
    ],
    image: "img",
  },
};
const nftMeta = { season: 1, meme_name: "meme" };

describe("MemePageArt", () => {
  it("returns empty when missing data", () => {
    const { container } = render(
      <MemePageArt show={false} nft={undefined} nftMeta={undefined} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders details when data present", () => {
    render(
      <MemePageArt show={true} nft={nft as any} nftMeta={nftMeta as any} />
    );
    expect(screen.getByText("Arweave Links")).toBeInTheDocument();
    expect(screen.getByText("Card Details")).toBeInTheDocument();
    expect(screen.getByText("Minting Approach")).toBeInTheDocument();
    expect(screen.getByText("Card Description")).toBeInTheDocument();
    expect(screen.getByText("Properties")).toBeInTheDocument();
    expect(screen.getByText("Stats")).toBeInTheDocument();
    expect(screen.getByText("Boosts")).toBeInTheDocument();
  });

  it("falls back to top-level media URLs for art links", () => {
    const nftWithTopLevelMedia = {
      ...nft,
      image: "https://top-level.example/image.png",
      animation: "https://top-level.example/animation.mp4",
      metadata: {
        image_details: { format: "png", width: 1, height: 2 },
        animation_details: { format: "gif", width: 1, height: 2 },
        attributes: nft.metadata.attributes,
      },
    };

    render(
      <MemePageArt
        show={true}
        nft={nftWithTopLevelMedia as any}
        nftMeta={nftMeta as any}
      />
    );

    expect(
      screen.getByRole("link", {
        name: "https://top-level.example/image.png",
      })
    ).toHaveAttribute("href", "https://top-level.example/image.png");
    expect(
      screen.getByRole("link", {
        name: "https://top-level.example/animation.mp4",
      })
    ).toHaveAttribute("href", "https://top-level.example/animation.mp4");
  });

  it("treats metadata.animation_url-only NFTs as animated", () => {
    const nftWithAnimationUrlOnly = {
      ...nft,
      animation: "",
      metadata: {
        image_details: { format: "png", width: 1, height: 2 },
        animation_details: { format: "gif", width: 1, height: 2 },
        animation_url: "https://metadata.example/animation.gif",
        attributes: nft.metadata.attributes,
        image: "img",
      },
    };

    render(
      <MemePageArt
        show={true}
        nft={nftWithAnimationUrlOnly as any}
        nftMeta={nftMeta as any}
      />
    );

    expect(screen.getAllByTestId("nft")).toHaveLength(2);
    expect(
      screen.getByRole("link", {
        name: "https://metadata.example/animation.gif",
      })
    ).toHaveAttribute("href", "https://metadata.example/animation.gif");
  });
});
