import { readFileSync } from "node:fs";
import { join } from "node:path";
import type React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockDownloadMediaUrl = jest.fn().mockResolvedValue(undefined);
const mockNFTImage = jest.fn(
  ({
    animation,
    id,
  }: {
    readonly animation: boolean;
    readonly id?: string | undefined;
  }) => <div data-testid={animation ? "animation-art" : "image-art"} id={id} />
);

jest.mock("react-bootstrap", () => {
  const Carousel = ({
    children,
    activeIndex,
  }: {
    readonly children: React.ReactNode;
    readonly activeIndex?: number | undefined;
  }) => (
    <div data-testid="carousel" data-active-index={activeIndex}>
      {children}
    </div>
  );

  Carousel.Item = ({
    children,
    className,
  }: {
    readonly children: React.ReactNode;
    readonly className?: string | undefined;
  }) => <div className={className}>{children}</div>;

  return {
    Carousel,
    Col: ({
      children,
      xs: _xs,
      ...props
    }: React.ComponentProps<"div"> & { readonly xs?: number }) => (
      <div {...props}>{children}</div>
    ),
    Container: ({ children, ...props }: React.ComponentProps<"div">) => (
      <div {...props}>{children}</div>
    ),
    Row: ({ children, ...props }: React.ComponentProps<"div">) => (
      <div {...props}>{children}</div>
    ),
  };
});

jest.mock("@/components/nft-image/NFTImage", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockNFTImage(...(args as [any])),
}));

jest.mock("@/components/nft-image/NFTImageBalance", () => ({
  __esModule: true,
  default: () => <div data-testid="nft-balance" />,
}));

jest.mock("@/helpers/Helpers", () => ({
  enterArtFullScreen: jest.fn(),
  fullScreenSupported: () => true,
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

jest.mock("@/helpers/media-download.helpers", () => ({
  __esModule: true,
  getDownloadFilenameFromUrl: jest.fn((url: string, fallback: string) => {
    return url.split("?")[0]?.split("/").pop() || fallback;
  }),
  downloadMediaUrl: (...args: unknown[]) => mockDownloadMediaUrl(...args),
  triggerDirectDownload: jest.fn(),
}));

import { MemePageArtViewer } from "@/components/the-memes/MemePageArtViewer";
import { AuthContext } from "@/components/auth/Auth";

const mockHelpers = jest.requireMock("@/helpers/Helpers") as {
  enterArtFullScreen: jest.Mock;
};

const renderWithConnectedProfile = (component: React.ReactNode) => {
  return render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { consolidation_key: "profile-key" },
          fetchingProfile: false,
          receivedProfileProxies: [],
          activeProfileProxy: null,
          showWaves: false,
          requestAuth: jest.fn(),
          setToast: jest.fn(),
          setActiveProfileProxy: jest.fn(),
        } as any
      }
    >
      {component}
    </AuthContext.Provider>
  );
};

const baseNft = {
  id: 5,
  contract: "0xmemes",
  created_at: new Date("2023-01-01"),
  mint_price: 1,
  supply: 10,
  name: "Meme Card",
  collection: "The Memes",
  token_type: "ERC721",
  description: "desc",
  artist: "artist",
  artist_seize_handle: "artist",
  uri: "https://metadata.example/meme.json",
  icon: "",
  thumbnail: "",
  scaled: "",
  image: "https://media.example/card.png",
  animation: "https://media.example/animation.mp4",
  metadata: {
    image: "https://media.example/card.png",
    animation_url: "https://media.example/animation.mp4",
    image_details: { format: "PNG" },
    animation_details: { format: "MP4" },
  },
  market_cap: 0,
  floor_price: 0,
  total_volume_last_24_hours: 0,
  total_volume_last_7_days: 0,
  total_volume_last_1_month: 0,
  total_volume: 0,
  highest_offer: 0,
  boosted_tdh: 0,
  tdh: 0,
  tdh__raw: 0,
  tdh_rank: 0,
  hodl_rate: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(window, "open").mockImplementation(() => null);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("MemePageArtViewer", () => {
  it("sizes carousel renderer wrappers without depending on Bootstrap Col", () => {
    const styles = readFileSync(
      join(process.cwd(), "components/the-memes/TheMemes.module.scss"),
      "utf8"
    );

    expect(styles).toContain(".memesCarousel :global(.carousel-item > *)");
    expect(styles).not.toContain(
      ".memesCarousel :global(.carousel-item > .col)"
    );
  });

  it("does not render an empty balance control for signed-out viewers", () => {
    render(<MemePageArtViewer nft={baseNft as any} showBalance />);

    expect(screen.queryByTestId("nft-balance")).not.toBeInTheDocument();
    expect(screen.getByText("MP4").parentElement).not.toHaveClass(
      "artControlsCenterWithBalance"
    );
  });

  it("pushes media controls right when the balance control is visible", () => {
    renderWithConnectedProfile(
      <MemePageArtViewer nft={baseNft as any} showBalance />
    );

    expect(screen.getByTestId("nft-balance")).toBeInTheDocument();
    expect(screen.getByText("MP4").parentElement).toHaveClass(
      "artControlsCenterWithBalance"
    );
  });

  it("does not render a standalone media format tag for single-media artwork", () => {
    renderWithConnectedProfile(
      <MemePageArtViewer
        nft={
          {
            ...baseNft,
            animation: "",
            metadata: {
              image: "https://media.example/card.png",
              image_details: { format: "PNG" },
            },
          } as any
        }
        showBalance
      />
    );

    expect(screen.getByTestId("nft-balance")).toBeInTheDocument();
    expect(screen.queryByText("PNG")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show previous artwork media" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show next artwork media" })
    ).not.toBeInTheDocument();
  });

  it("renders inline media actions for the active artwork", async () => {
    const user = userEvent.setup();

    render(<MemePageArtViewer nft={baseNft as any} />);

    expect(
      screen.getByRole("button", { name: "Full screen" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open in new tab" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View artwork fullscreen" })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Full screen" }));

    expect(mockHelpers.enterArtFullScreen).toHaveBeenCalledWith(
      "the-art-fullscreen-animation"
    );
  });

  it("uses optimized media for the top artwork viewer", () => {
    render(<MemePageArtViewer nft={baseNft as any} />);

    expect(mockNFTImage).toHaveBeenCalledWith(
      expect.objectContaining({ animation: true }),
      undefined
    );
    expect(mockNFTImage).toHaveBeenCalledWith(
      expect.objectContaining({ animation: false }),
      undefined
    );
    for (const [props] of mockNFTImage.mock.calls) {
      expect(props).not.toHaveProperty("showOriginal");
    }
  });

  it("switches toolbar open and download targets with the carousel slide", async () => {
    const user = userEvent.setup();

    render(<MemePageArtViewer nft={baseNft as any} />);

    await user.click(screen.getByRole("button", { name: "Open in new tab" }));
    expect(window.open).toHaveBeenLastCalledWith(
      "https://media.example/animation.mp4",
      "_blank",
      "noopener,noreferrer"
    );

    await user.click(screen.getByRole("button", { name: "Download media" }));
    await waitFor(() => {
      expect(mockDownloadMediaUrl).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dialogTitle: "Save animation",
          fileName: "animation.mp4",
          url: "https://media.example/animation.mp4",
        })
      );
    });

    await user.click(
      screen.getByRole("button", { name: "Show next artwork media" })
    );

    await user.click(screen.getByRole("button", { name: "Open in new tab" }));
    expect(window.open).toHaveBeenLastCalledWith(
      "https://media.example/card.png",
      "_blank",
      "noopener,noreferrer"
    );

    await user.click(screen.getByRole("button", { name: "Download media" }));
    await waitFor(() => {
      expect(mockDownloadMediaUrl).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dialogTitle: "Save image",
          fileName: "card.png",
          url: "https://media.example/card.png",
        })
      );
    });
  });

  it("uses restricted-open media behavior from useMediaActions", () => {
    render(
      <MemePageArtViewer
        nft={
          {
            ...baseNft,
            image: "",
            animation: "https://media.example/animation.mov",
            metadata: {
              image: "",
              animation_url: "https://media.example/animation.mov",
              animation_details: { format: "MOV" },
            },
          } as any
        }
      />
    );

    expect(
      screen.getByRole("button", { name: "Full screen" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download media" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open in new tab" })
    ).not.toBeInTheDocument();
  });
});
