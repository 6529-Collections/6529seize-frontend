import MemesQuickVotePreview from "@/components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVotePreview";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";

let mockHasTouchScreen = false;
const mockGetMediaGatewayFallbackUrls = jest.fn();

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

jest.mock("@/components/nft-image/utils/gateway-fallback", () => ({
  getMediaGatewayFallbackUrls: (url: string) =>
    mockGetMediaGatewayFallbackUrls(url),
  shouldUseIframeFallbackTimeout: () => false,
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: mockHasTouchScreen }),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

jest.mock("@/components/content-moderation/ContentModerationDropGate", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/waves/drops/WaveDropAuthorPfp", () => ({
  __esModule: true,
  default: () => <div data-testid="author-pfp" />,
}));

jest.mock("@/components/waves/drops/time/WaveDropTime", () => ({
  __esModule: true,
  default: () => <span>just now</span>,
}));

jest.mock("@/components/waves/drops/signature/DropAuthorSignedMarker", () => ({
  WithDropAuthorSignedMarker: ({
    children,
  }: {
    readonly children: ReactNode;
  }) => <>{children}</>,
}));

jest.mock(
  "@/components/drops/view/item/content/media/MediaDisplayImage",
  () => ({
    __esModule: true,
    default: ({ src }: { readonly src: string }) => (
      <div data-testid="preview-image" data-src={src} />
    ),
  })
);

const HTML_MEDIA_CID = "Qmd5N9f92qgeHoeCJZFf6XVvXice6Pn6uLc42rWXGLQXYr";
const HTML_MEDIA_GATEWAY_URL = `https://media.6529.io/ipfs/${HTML_MEDIA_CID}`;
const HTML_FRAME_TITLE = `Interactive HTML media: ${HTML_MEDIA_GATEWAY_URL}`;
const PREVIEW_IMAGE_URL = "https://d3lqz0a4bldqgf.cloudfront.net/preview.png";

const createHtmlDrop = () =>
  ({
    id: "1380fcd1-8e62-4bb4-bab4-92aa56c6ad04",
    serial_no: 1609011,
    created_at: Date.now(),
    wave: { id: "wave-1", name: "The Memes - Main Stage" },
    author: { handle: "MindTheArtist", primary_address: "0x1" },
    metadata: [
      { data_key: "title", data_value: "6529 TV" },
      { data_key: "description", data_value: "An interactive CRT." },
      {
        data_key: "additional_media",
        data_value: JSON.stringify({ preview_image: PREVIEW_IMAGE_URL }),
      },
    ],
    parts: [
      {
        content: null,
        media: [
          {
            mime_type: "text/html",
            url: `ipfs://${HTML_MEDIA_CID}`,
          },
        ],
      },
    ],
  }) as unknown as ComponentProps<typeof MemesQuickVotePreview>["drop"];

const renderPreview = ({ isMobile }: { readonly isMobile: boolean }) =>
  render(
    <MemesQuickVotePreview
      drop={createHtmlDrop()}
      isBusy={false}
      isMobile={isMobile}
      leftThisRoundCount={493}
      swipeVoteAmount={null}
      uncastPower={1_000}
      unratedCount={502}
      votingLabel="TDH"
      onAdvanceStart={jest.fn()}
      onSkip={jest.fn()}
      onVoteWithSwipe={jest.fn()}
    />
  );

const getArtworkFrame = () => screen.getByTitle(HTML_FRAME_TITLE);

describe("MemesQuickVotePreview interactive HTML artwork", () => {
  beforeEach(() => {
    mockHasTouchScreen = false;
    mockGetMediaGatewayFallbackUrls.mockReset();
    mockGetMediaGatewayFallbackUrls.mockReturnValue([HTML_MEDIA_GATEWAY_URL]);
  });

  it("loads the sandboxed HTML artwork right away on desktop", () => {
    renderPreview({ isMobile: false });

    const frame = getArtworkFrame();
    expect(mockGetMediaGatewayFallbackUrls).toHaveBeenCalledWith(
      `ipfs://${HTML_MEDIA_CID}`
    );
    expect(frame.tagName).toBe("IFRAME");
    expect(frame).toHaveAttribute("src", HTML_MEDIA_GATEWAY_URL);
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    const sandboxTokens = (frame.getAttribute("sandbox") ?? "")
      .split(" ")
      .filter(Boolean);
    // Guards the tokenizer itself, so the negative checks below cannot pass
    // vacuously on a mis-split attribute.
    expect(sandboxTokens).toEqual(["allow-scripts"]);
    expect(sandboxTokens).not.toContain("allow-same-origin");
    expect(sandboxTokens).not.toContain("allow-top-navigation");
    expect(sandboxTokens).not.toContain("allow-popups");
    expect(frame).toHaveAttribute("allow", "fullscreen");
    expect(
      screen.queryByRole("button", { name: "Load interactive media" })
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("preview-image")).not.toBeInTheDocument();
  });

  it("shows a loading status until the HTML artwork finishes loading", () => {
    renderPreview({ isMobile: false });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading interactive media"
    );

    fireEvent.load(getArtworkFrame());

    expect(
      screen.queryByText("Loading interactive media")
    ).not.toBeInTheDocument();
  });

  it.each([
    { isMobile: true, layout: "mobile" },
    { isMobile: false, layout: "desktop" },
  ])(
    "keeps tap-to-load with the preview poster on touch screens ($layout layout)",
    ({ isMobile }) => {
      mockHasTouchScreen = true;
      renderPreview({ isMobile });

      expect(screen.getByTestId("preview-image")).toHaveAttribute(
        "data-src",
        PREVIEW_IMAGE_URL
      );
      expect(screen.queryByTitle(HTML_FRAME_TITLE)).not.toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "Load interactive media" })
      );

      const frame = getArtworkFrame();
      expect(frame).toHaveAttribute("src", HTML_MEDIA_GATEWAY_URL);
      expect(screen.getByRole("status")).toHaveTextContent(
        "Loading interactive media"
      );

      fireEvent.load(frame);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    }
  );
});
