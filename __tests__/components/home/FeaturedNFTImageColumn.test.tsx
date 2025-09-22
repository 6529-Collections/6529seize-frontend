import FeaturedNFTImageColumn from "@/components/home/FeaturedNFTImageColumn";
import { NFTWithMemesExtendedData } from "@/entities/INFT";
import { render, screen } from "@testing-library/react";

// Mock dependencies
jest.mock("@/components/nft-image/NFTImage", () => {
  return function MockNFTImage(props: any) {
    return (
      <div data-testid="nft-image">
        <span data-testid="nft-id">{props.nft.id}</span>
        <span data-testid="nft-animation">{props.animation.toString()}</span>
        <span data-testid="nft-height">{props.height}</span>
        <span data-testid="nft-show-balance">
          {(props.showBalance ?? false).toString()}
        </span>
      </div>
    );
  };
});

jest.mock("next/link", () => {
  return function MockLink({ children, href, className }: any) {
    return (
      <a href={href} className={className} data-testid="mock-link">
        {children}
      </a>
    );
  };
});

// Mock NFT data
const mockNFT: NFTWithMemesExtendedData = {
  id: 1,
  name: "Test NFT",
  contract: "0x123",
  collection: "The Memes",
  season: 1,
  meme_name: "Test Meme",
  artist: "Test Artist",
  mint_date: "2024-01-01",
  metadata: {
    name: "Test NFT",
    description: "Test Description",
    image: "https://example.com/image.jpg",
    animation_url: "https://example.com/animation.mp4",
  },
  animation: null,
  image: "https://example.com/image.jpg",
} as NFTWithMemesExtendedData;

describe("FeaturedNFTImageColumn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render without crashing with required props", () => {
      render(<FeaturedNFTImageColumn featuredNft={mockNFT} />);

      expect(screen.getByTestId("nft-image")).toBeInTheDocument();
    });

    it("should render with proper Bootstrap Col structure and responsive props", () => {
      const { container } = render(
        <FeaturedNFTImageColumn featuredNft={mockNFT} />
      );

      const col = container.querySelector('[class*="col"]');
      expect(col).toBeInTheDocument();
      expect(col).toHaveClass(
        "pt-3",
        "pb-5",
        "d-flex",
        "align-items-start",
        "justify-content-center"
      );
    });

    it("should render Container with no-padding class", () => {
      const { container } = render(
        <FeaturedNFTImageColumn featuredNft={mockNFT} />
      );

      const containerEl = container.querySelector(".container.no-padding");
      expect(containerEl).toBeInTheDocument();
    });

    it("should render with correct responsive breakpoints", () => {
      const { container } = render(
        <FeaturedNFTImageColumn featuredNft={mockNFT} />
      );

      const col = container.querySelector('[class*="col"]');
      expect(col).toHaveClass("col-12", "col-sm-12", "col-md-6", "col-lg-6");
    });
  });

  describe("NFT Animation Conditional Rendering", () => {
    it("should render NFTImage directly when NFT has animation property", () => {
      const nftWithAnimation = {
        ...mockNFT,
        animation: "https://example.com/animation.mp4",
      };

      render(<FeaturedNFTImageColumn featuredNft={nftWithAnimation} />);

      expect(screen.getByTestId("nft-image")).toBeInTheDocument();
      expect(screen.queryByTestId("mock-link")).not.toBeInTheDocument();
    });

    it("should render NFTImage directly when NFT has metadata animation", () => {
      const nftWithMetadataAnimation = {
        ...mockNFT,
        animation: null,
        metadata: {
          ...mockNFT.metadata,
          animation: "https://example.com/animation.gif",
        },
      };

      render(<FeaturedNFTImageColumn featuredNft={nftWithMetadataAnimation} />);

      expect(screen.getByTestId("nft-image")).toBeInTheDocument();
      expect(screen.queryByTestId("mock-link")).not.toBeInTheDocument();
    });

    it("should render Link wrapper when NFT has no animation", () => {
      const nftWithoutAnimation = {
        ...mockNFT,
        animation: null,
        metadata: {
          ...mockNFT.metadata,
          animation: null,
          animation_url: null,
        },
      };

      render(<FeaturedNFTImageColumn featuredNft={nftWithoutAnimation} />);

      const link = screen.getByTestId("mock-link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/the-memes/1");
      expect(screen.getByTestId("nft-image")).toBeInTheDocument();
    });

    it("should check animation in both direct property and metadata", () => {
      const nftWithoutAnyAnimation = {
        ...mockNFT,
        animation: null,
        metadata: {
          ...mockNFT.metadata,
          animation: null,
          animation_url: null,
        },
      };

      render(<FeaturedNFTImageColumn featuredNft={nftWithoutAnyAnimation} />);

      expect(screen.getByTestId("mock-link")).toBeInTheDocument();
    });
  });

  describe("NFTImage Component Integration", () => {
    it("should pass correct props to NFTImage component", () => {
      render(<FeaturedNFTImageColumn featuredNft={mockNFT} />);

      expect(screen.getByTestId("nft-id")).toHaveTextContent("1");
      expect(screen.getByTestId("nft-animation")).toHaveTextContent("true");
      expect(screen.getByTestId("nft-height")).toHaveTextContent("650");
      expect(screen.getByTestId("nft-show-balance")).toHaveTextContent("true");
    });

    it("should always pass animation as true to NFTImage", () => {
      render(<FeaturedNFTImageColumn featuredNft={mockNFT} />);

      expect(screen.getByTestId("nft-animation")).toHaveTextContent("true");
    });

    it("should always pass height as 650 to NFTImage", () => {
      render(<FeaturedNFTImageColumn featuredNft={mockNFT} />);

      expect(screen.getByTestId("nft-height")).toHaveTextContent("650");
    });

    it("should always pass showBalance as true", () => {
      render(<FeaturedNFTImageColumn featuredNft={mockNFT} />);

      expect(screen.getByTestId("nft-show-balance")).toHaveTextContent("true");
    });
  });

  describe("Link Generation", () => {
    it("should generate correct link URL when NFT has no animation", () => {
      const nftWithId = {
        ...mockNFT,
        id: 42,
        animation: null,
        metadata: {
          ...mockNFT.metadata,
          animation: null,
        },
      };

      render(<FeaturedNFTImageColumn featuredNft={nftWithId} />);

      const link = screen.getByTestId("mock-link");
      expect(link).toHaveAttribute("href", "/the-memes/42");
    });

    it("should generate correct link URL for different NFT IDs", () => {
      const testIds = [1, 100, 999, 1234];

      for (const id of testIds) {
        const nftWithId = {
          ...mockNFT,
          id,
          animation: null,
          metadata: {
            ...mockNFT.metadata,
            animation: null,
          },
        };

        const { unmount } = render(
          <FeaturedNFTImageColumn featuredNft={nftWithId} />
        );

        const link = screen.getByTestId("mock-link");
        expect(link).toHaveAttribute("href", `/the-memes/${id}`);
        unmount();
      }
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle undefined animation gracefully", () => {
      const nftWithUndefinedAnimation = {
        ...mockNFT,
        animation: undefined,
        metadata: {
          ...mockNFT.metadata,
          animation: undefined,
        },
      } as any;

      expect(() => {
        render(
          <FeaturedNFTImageColumn featuredNft={nftWithUndefinedAnimation} />
        );
      }).not.toThrow();

      expect(screen.getByTestId("mock-link")).toBeInTheDocument();
    });

    it("should handle NFT with missing metadata gracefully", () => {
      const nftWithMinimalMetadata = {
        ...mockNFT,
        metadata: {} as any,
      };

      expect(() => {
        render(<FeaturedNFTImageColumn featuredNft={nftWithMinimalMetadata} />);
      }).not.toThrow();

      expect(screen.getByTestId("nft-image")).toBeInTheDocument();
    });

    it("should handle null animation values", () => {
      const nftWithNullAnimation = {
        ...mockNFT,
        animation: null,
        metadata: {
          ...mockNFT.metadata,
          animation: null,
        },
      };

      expect(() => {
        render(<FeaturedNFTImageColumn featuredNft={nftWithNullAnimation} />);
      }).not.toThrow();

      expect(screen.getByTestId("mock-link")).toBeInTheDocument();
    });

    it("should handle NFT with missing animation properties", () => {
      const nftWithoutAnimationProp = {
        ...mockNFT,
        metadata: {
          name: "Test NFT",
          description: "Test Description",
          image: "https://example.com/image.jpg",
        },
      } as any;
      delete nftWithoutAnimationProp.animation;

      expect(() => {
        render(
          <FeaturedNFTImageColumn featuredNft={nftWithoutAnimationProp} />
        );
      }).not.toThrow();

      expect(screen.getByTestId("mock-link")).toBeInTheDocument();
    });
  });

  describe("Layout Structure", () => {
    it("should render proper Bootstrap layout hierarchy", () => {
      const { container } = render(
        <FeaturedNFTImageColumn featuredNft={mockNFT} />
      );

      // Check Col > Container > Row structure
      const col = container.querySelector('[class*="col"]');
      const containerEl = col?.querySelector(".container.no-padding");
      const row = containerEl?.querySelector('[class*="row"]');

      expect(col).toBeInTheDocument();
      expect(containerEl).toBeInTheDocument();
      expect(row).toBeInTheDocument();
    });

    it("should apply correct flexbox classes to Col", () => {
      const { container } = render(
        <FeaturedNFTImageColumn featuredNft={mockNFT} />
      );

      const col = container.querySelector('[class*="col"]');
      expect(col).toHaveClass(
        "d-flex",
        "align-items-start",
        "justify-content-center"
      );
    });

    it("should apply correct padding classes to Col", () => {
      const { container } = render(
        <FeaturedNFTImageColumn featuredNft={mockNFT} />
      );

      const col = container.querySelector('[class*="col"]');
      expect(col).toHaveClass("pt-3", "pb-5");
    });
  });
});
