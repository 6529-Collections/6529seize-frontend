import LatestDropNextMintPanel from "@/components/home/now-minting/LatestDropNextMintPanel";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";
import { fireEvent, render, screen } from "@testing-library/react";

// The home Next Drop panel is the other `loadStrategy="eager"` caller that can
// render interactive HTML. Render it through the real media chain so its
// behavior stays pinned alongside Memes quick vote.

let mockHasTouchScreen = false;

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: mockHasTouchScreen }),
}));

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

jest.mock("@/components/nft-image/utils/gateway-fallback", () => ({
  getMediaGatewayFallbackUrls: () => [MOCK_HTML_MEDIA_GATEWAY_URL],
  shouldUseIframeFallbackTimeout: () => false,
}));

jest.mock("@/components/home/now-minting/LatestDropNextMintSubscribe", () => ({
  __esModule: true,
  default: () => <div data-testid="subscribe" />,
}));

jest.mock("@/components/home/now-minting/LatestDropAllowlistStatus", () => ({
  __esModule: true,
  default: () => <div data-testid="allowlist-status" />,
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

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} />
  ),
}));

jest.mock("next/link", () => {
  const { mockNextLinkComponent } = jest.requireActual(
    "@/__tests__/utils/nextLinkMock"
  );

  return {
    __esModule: true,
    default: mockNextLinkComponent,
  };
});

const HTML_MEDIA_CID = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
const MOCK_HTML_MEDIA_GATEWAY_URL = `https://media.6529.io/ipfs/${HTML_MEDIA_CID}`;
const HTML_FRAME_TITLE = `Interactive HTML media: ${MOCK_HTML_MEDIA_GATEWAY_URL}`;
const PREVIEW_IMAGE_URL = "https://d3lqz0a4bldqgf.cloudfront.net/next.png";

const createHtmlDrop = (): ApiDropV2View =>
  ({
    id: "drop-html",
    title: "Interactive next drop",
    parts: [
      {
        media: [{ mime_type: "text/html", url: `ipfs://${HTML_MEDIA_CID}` }],
      },
    ],
    metadata: [
      {
        data_key: "additional_media",
        data_value: JSON.stringify({ preview_image: PREVIEW_IMAGE_URL }),
      },
    ],
    author: {
      handle: "artist",
      primary_address: "0xartist",
      pfp: null,
    },
    created_at: Date.parse("2026-07-13T09:00:00Z"),
    rating: 123,
    wave: {
      id: "main-stage-wave",
      name: "Memes Main Stage",
      picture: null,
    },
  }) as unknown as ApiDropV2View;

describe("LatestDropNextMintPanel interactive HTML artwork", () => {
  beforeEach(() => {
    mockHasTouchScreen = false;
  });

  it("mounts the sandboxed HTML frame on desktop", () => {
    render(<LatestDropNextMintPanel drop={createHtmlDrop()} />);

    const frame = screen.getByTitle(HTML_FRAME_TITLE);
    expect(frame).toHaveAttribute("src", MOCK_HTML_MEDIA_GATEWAY_URL);
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    expect(screen.queryByTestId("preview-image")).not.toBeInTheDocument();
  });

  it("shows the preview behind Tap to load on touch screens", () => {
    mockHasTouchScreen = true;
    render(<LatestDropNextMintPanel drop={createHtmlDrop()} />);

    expect(screen.getByTestId("preview-image")).toHaveAttribute(
      "data-src",
      PREVIEW_IMAGE_URL
    );
    expect(screen.queryByTitle(HTML_FRAME_TITLE)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Load interactive media" })
    );

    expect(screen.getByTitle(HTML_FRAME_TITLE)).toHaveAttribute(
      "src",
      MOCK_HTML_MEDIA_GATEWAY_URL
    );
  });
});
