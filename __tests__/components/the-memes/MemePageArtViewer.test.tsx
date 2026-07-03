import { readFileSync } from "node:fs";
import { join } from "node:path";
import type React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { t } from "@/i18n/messages";

const mockDownloadMediaUrl = jest.fn().mockResolvedValue(undefined);
type MockNFTImageProps = {
  readonly animation: boolean;
  readonly id?: string | undefined;
  readonly showOriginal?: boolean | undefined;
};

const mockNFTImage = jest.fn(({ animation, id }: MockNFTImageProps) => (
  <div data-testid={animation ? "animation-art" : "image-art"} id={id} />
));
const mockNFTImageBalance = jest.fn(
  ({ variant }: { readonly variant?: string | undefined }) => (
    <div data-testid="nft-balance" data-variant={variant} />
  )
);

jest.mock("@/components/nft-image/NFTImage", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockNFTImage(...(args as [any])),
}));

jest.mock("@/components/nft-image/NFTImageBalance", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockNFTImageBalance(...(args as [any])),
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

function getLatestNFTImageProps(animation: boolean) {
  const call = [...mockNFTImage.mock.calls]
    .reverse()
    .find(([props]) => (props as MockNFTImageProps).animation === animation);

  if (!call) {
    throw new Error(`No NFTImage render found for animation=${animation}`);
  }

  return call[0] as MockNFTImageProps;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

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
  scaled: "https://media.example/card-scaled.png",
  image: "https://media.example/card.png",
  animation: "https://media.example/animation.mp4",
  compressed_animation: "https://media.example/animation-compressed.mp4",
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
  mockHelpers.enterArtFullScreen.mockResolvedValue(true);
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

    expect(styles).toContain(".memesCarousel [data-carousel-slide] > *");
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
    expect(mockNFTImageBalance).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "compact" }),
      undefined
    );
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

  it("uses locale-backed labels for artwork media controls", () => {
    render(<MemePageArtViewer nft={baseNft as any} locale="de-DE" />);

    expect(
      screen.getByRole("button", {
        name: t("de-DE", "theMemes.detail.art.media.fullscreen"),
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: t("de-DE", "theMemes.detail.art.media.openInNewTab"),
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: t("de-DE", "theMemes.detail.art.media.download"),
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: t("de-DE", "theMemes.detail.art.media.next"),
      })
    ).toBeInTheDocument();
  });

  it("renders only fullscreen for html artwork media actions", () => {
    render(
      <MemePageArtViewer
        nft={
          {
            ...baseNft,
            image: "",
            animation: "https://media.example/interactive.html",
            metadata: {
              image: "",
              animation_url: "https://media.example/interactive.html",
              animation_details: { format: "HTML" },
            },
          } as any
        }
      />
    );

    expect(
      screen.getByRole("button", { name: "Full screen" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open in new tab" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download media" })
    ).not.toBeInTheDocument();
  });

  it("uses optimized media for the initial artwork render", () => {
    render(<MemePageArtViewer nft={baseNft as any} />);

    expect(getLatestNFTImageProps(true).showOriginal).toBe(false);
    expect(getLatestNFTImageProps(false).showOriginal).toBe(false);
  });

  it("uses original media while fullscreen is requested and until fullscreen exits", async () => {
    const user = userEvent.setup();
    const fullscreenRequest = createDeferred<boolean>();
    mockHelpers.enterArtFullScreen.mockReturnValue(fullscreenRequest.promise);

    render(<MemePageArtViewer nft={baseNft as any} />);

    expect(getLatestNFTImageProps(true).showOriginal).toBeFalsy();

    await user.click(screen.getByRole("button", { name: "Full screen" }));

    expect(getLatestNFTImageProps(true).showOriginal).toBe(true);
    expect(getLatestNFTImageProps(false).showOriginal).toBeFalsy();
    expect(mockHelpers.enterArtFullScreen).toHaveBeenCalledWith(
      "the-art-fullscreen-animation"
    );

    await act(async () => {
      fullscreenRequest.resolve(true);
      await fullscreenRequest.promise;
    });

    expect(getLatestNFTImageProps(true).showOriginal).toBe(true);

    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    expect(getLatestNFTImageProps(true).showOriginal).toBeFalsy();
  });

  it("clears original media when fullscreen request reports failure", async () => {
    const user = userEvent.setup();
    const fullscreenRequest = createDeferred<boolean>();
    mockHelpers.enterArtFullScreen.mockReturnValue(fullscreenRequest.promise);

    render(<MemePageArtViewer nft={baseNft as any} />);

    await user.click(screen.getByRole("button", { name: "Full screen" }));

    expect(getLatestNFTImageProps(true).showOriginal).toBe(true);

    await act(async () => {
      fullscreenRequest.resolve(false);
      await fullscreenRequest.promise;
    });

    expect(getLatestNFTImageProps(true).showOriginal).toBeFalsy();
  });

  it("clears original media on prefixed fullscreen exit events", async () => {
    const user = userEvent.setup();

    render(<MemePageArtViewer nft={baseNft as any} />);

    await user.click(screen.getByRole("button", { name: "Full screen" }));

    expect(getLatestNFTImageProps(true).showOriginal).toBe(true);

    act(() => {
      document.dispatchEvent(new Event("webkitfullscreenchange"));
    });

    expect(getLatestNFTImageProps(true).showOriginal).toBeFalsy();
  });

  it("clears original media on fullscreen error events", async () => {
    const user = userEvent.setup();
    const fullscreenErrorEvents = [
      "fullscreenerror",
      "webkitfullscreenerror",
      "mozfullscreenerror",
      "MSFullscreenError",
    ];

    render(<MemePageArtViewer nft={baseNft as any} />);

    for (const eventName of fullscreenErrorEvents) {
      const fullscreenRequest = createDeferred<boolean>();
      mockHelpers.enterArtFullScreen.mockReturnValueOnce(
        fullscreenRequest.promise
      );

      await user.click(screen.getByRole("button", { name: "Full screen" }));

      expect(getLatestNFTImageProps(true).showOriginal).toBe(true);

      act(() => {
        document.dispatchEvent(new Event(eventName));
      });

      expect(getLatestNFTImageProps(true).showOriginal).toBeFalsy();

      await act(async () => {
        fullscreenRequest.resolve(true);
        await fullscreenRequest.promise;
      });
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
