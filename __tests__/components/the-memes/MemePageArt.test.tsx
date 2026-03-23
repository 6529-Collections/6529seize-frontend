import { MemePageArt } from "@/components/the-memes/MemePageArt";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("react-bootstrap", () => {
  const actual = jest.requireActual("react-bootstrap");
  const Carousel = ({ children, onSlide, ...props }: any) => (
    <div data-testid="carousel" {...props}>
      <button
        type="button"
        data-testid="carousel-slide-0"
        onClick={() => onSlide?.(0)}
      />
      <button
        type="button"
        data-testid="carousel-slide-1"
        onClick={() => onSlide?.(1)}
      />
      {children}
    </div>
  );

  Carousel.Item = ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  );

  return {
    ...actual,
    Carousel,
  };
});

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: (props: any) => (
    <svg data-testid="fullscreen-icon" onClick={props.onClick} />
  ),
}));

jest.mock("@/components/nft-image/NFTImage", () => ({
  __esModule: true,
  default: () => <div data-testid="nft" />,
}));
jest.mock("@/components/download/Download", () => ({
  __esModule: true,
  default: ({ href }: { href: string }) => (
    <div data-testid="download" data-href={href} />
  ),
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
  getAnimationDimensionsFromMetadata: jest.fn(),
  getAnimationFileTypeFromMetadata: jest.fn(),
  getImageDimensionsFromMetadata: jest.fn(),
  getImageFileTypeFromMetadata: jest.fn(),
}));
jest.mock("@/components/nft-attributes/NFTAttributes", () => ({
  __esModule: true,
  default: () => <div data-testid="attrs" />,
}));

const mockHelpers = jest.requireMock("@/helpers/Helpers") as {
  enterArtFullScreen: jest.Mock;
};
const mockNftHelpers = jest.requireMock("@/helpers/nft.helpers") as {
  getAnimationDimensionsFromMetadata: jest.Mock;
  getAnimationFileTypeFromMetadata: jest.Mock;
  getImageDimensionsFromMetadata: jest.Mock;
  getImageFileTypeFromMetadata: jest.Mock;
};

const nft = {
  id: 5,
  has_distribution: false,
  mint_price: 1,
  supply: 10,
  collection: "c",
  artist: "a",
  mint_date: "2023",
  description: "desc",
  uri: "https://metadata.example/meme.json",
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

const getCardDetailValue = (label: string): string => {
  const labelCell = screen.getByText((_, element) => {
    return element?.textContent?.toLowerCase() === label.toLowerCase();
  });
  const row = labelCell.closest("tr");
  const value = row?.querySelectorAll("td")[1]?.textContent;

  expect(value).toBeTruthy();
  return value ?? "";
};

beforeEach(() => {
  jest.clearAllMocks();
  mockNftHelpers.getAnimationFileTypeFromMetadata.mockReturnValue("gif");
  mockNftHelpers.getImageFileTypeFromMetadata.mockReturnValue("png");
  mockNftHelpers.getAnimationDimensionsFromMetadata.mockReturnValue("200x300");
  mockNftHelpers.getImageDimensionsFromMetadata.mockReturnValue("100x100");
});

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
    expect(
      screen.getByRole("link", {
        name: "https://metadata.example/meme.json",
      })
    ).toHaveAttribute("href", "https://metadata.example/meme.json");
    expect(
      screen.getByRole("link", { name: "Open JSON in new tab" })
    ).toHaveAttribute("href", "https://metadata.example/meme.json");
    expect(
      screen.getByRole("link", { name: "Open image in new tab" })
    ).toHaveAttribute("href", "img");
    expect(screen.getByText("Card Details")).toBeInTheDocument();
    expect(screen.getByText("Minting Approach")).toBeInTheDocument();
    expect(screen.getByText("Card Description")).toBeInTheDocument();
    expect(screen.getByText("Properties")).toBeInTheDocument();
    expect(screen.getByText("Stats")).toBeInTheDocument();
    expect(screen.getByText("Boosts")).toBeInTheDocument();
    expect(getCardDetailValue("File type")).toBe("png");
    expect(getCardDetailValue("Dimensions")).toBe("100x100");
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
    expect(
      screen.getByRole("link", { name: "Open image in new tab" })
    ).toHaveAttribute("href", "https://top-level.example/image.png");
    expect(
      screen.getByRole("link", { name: "Open animation in new tab" })
    ).toHaveAttribute("href", "https://top-level.example/animation.mp4");
  });

  it("prefers metadata animation_url over top-level animation for art links", () => {
    const nftWithMetadataAnimationUrl = {
      ...nft,
      animation: "https://cdn.example.com/animation.mp4",
      metadata: {
        ...nft.metadata,
        animation_url: "https://arweave.net/animation.mp4",
      },
    };

    render(
      <MemePageArt
        show={true}
        nft={nftWithMetadataAnimationUrl as any}
        nftMeta={nftMeta as any}
      />
    );

    expect(
      screen.getByRole("link", {
        name: "https://arweave.net/animation.mp4",
      })
    ).toHaveAttribute("href", "https://arweave.net/animation.mp4");
    expect(
      screen.getByRole("link", { name: "Open animation in new tab" })
    ).toHaveAttribute("href", "https://arweave.net/animation.mp4");
  });

  it("ignores whitespace metadata.image and falls back to the top-level image", () => {
    const nftWithWhitespaceMetadataImage = {
      ...nft,
      image: "  https://top-level.example/image.png  ",
      metadata: {
        ...nft.metadata,
        image: "   ",
      },
    };

    render(
      <MemePageArt
        show={true}
        nft={nftWithWhitespaceMetadataImage as any}
        nftMeta={nftMeta as any}
      />
    );

    expect(
      screen.getByRole("link", {
        name: "https://top-level.example/image.png",
      })
    ).toHaveAttribute("href", "https://top-level.example/image.png");
    expect(
      screen.getByRole("link", { name: "Open image in new tab" })
    ).toHaveAttribute("href", "https://top-level.example/image.png");
    expect(screen.getAllByTestId("download")[0]).toHaveAttribute(
      "data-href",
      "https://top-level.example/image.png"
    );
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
    expect(
      screen.getByRole("link", { name: "Open image in new tab" })
    ).toHaveAttribute("href", "img");
    expect(
      screen.getByRole("link", { name: "Open animation in new tab" })
    ).toHaveAttribute("href", "https://metadata.example/animation.gif");
    expect(getCardDetailValue("File type")).toBe("gif");
    expect(getCardDetailValue("Dimensions")).toBe("200x300");
  });

  it("switches card details to image metadata on the image slide", () => {
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

    fireEvent.click(screen.getByTestId("carousel-slide-1"));

    expect(getCardDetailValue("File type")).toBe("png");
    expect(getCardDetailValue("Dimensions")).toBe("100x100");
  });

  it("keeps animation active when the NFT has no image slide", () => {
    const nftWithAnimationOnly = {
      ...nft,
      image: "",
      animation: "",
      metadata: {
        image_details: undefined,
        animation_details: { format: "gif", width: 1, height: 2 },
        animation_url: "https://metadata.example/animation.gif",
        attributes: nft.metadata.attributes,
        image: "",
      },
    };

    render(
      <MemePageArt
        show={true}
        nft={nftWithAnimationOnly as any}
        nftMeta={nftMeta as any}
      />
    );

    expect(screen.getAllByTestId("nft")).toHaveLength(1);
    expect(getCardDetailValue("File type")).toBe("gif");
    expect(getCardDetailValue("Dimensions")).toBe("200x300");

    fireEvent.click(screen.getByTestId("carousel-slide-1"));

    expect(screen.getAllByTestId("nft")).toHaveLength(1);
    expect(getCardDetailValue("File type")).toBe("gif");
    expect(getCardDetailValue("Dimensions")).toBe("200x300");

    fireEvent.click(screen.getAllByTestId("fullscreen-icon")[0]!);

    expect(mockHelpers.enterArtFullScreen).toHaveBeenCalledWith(
      "the-art-fullscreen-animation"
    );
  });
});
