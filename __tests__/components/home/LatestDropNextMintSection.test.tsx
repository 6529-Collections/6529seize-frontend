import LatestDropNextMintPanel from "@/components/home/now-minting/LatestDropNextMintPanel";
import LatestDropNextMintSection from "@/components/home/now-minting/LatestDropNextMintSection";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";
import { render, screen } from "@testing-library/react";

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: false }),
}));

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

jest.mock("@/components/home/now-minting/LatestDropNextMintSubscribe", () => ({
  __esModule: true,
  default: ({ tokenId }: { readonly tokenId?: number }) => (
    <div data-testid="subscribe" data-token-id={tokenId} />
  ),
}));

jest.mock("@/components/home/now-minting/LatestDropAllowlistStatus", () => ({
  __esModule: true,
  default: ({ tokenId }: { readonly tokenId: number }) => (
    <div data-testid="allowlist-status" data-token-id={tokenId} />
  ),
}));

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

jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => ({
    __esModule: true,
    default: ({
      artworkVideoLayout,
      loadStrategy,
      videoAlign,
    }: {
      readonly artworkVideoLayout?: boolean;
      readonly loadStrategy?: string;
      readonly videoAlign?: string;
    }) => (
      <div
        data-testid="drop-media"
        data-fill={String(artworkVideoLayout)}
        data-load-strategy={loadStrategy}
        data-align={videoAlign}
      />
    ),
  })
);

const createDrop = (memeCardId?: number): ApiDropV2View =>
  ({
    id: "drop-1",
    title: "Next winner",
    parts: [],
    metadata: [],
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
    ...(memeCardId ? { submission_context: { meme_card_id: memeCardId } } : {}),
  }) as ApiDropV2View;

it.each([
  ["image/png", "true"],
  ["video/mp4", "false"],
])(
  "identifies %s Next Drop media even without a rendered image",
  (mime_type, isImage) => {
    const drop = {
      ...createDrop(488),
      parts: [{ media: [{ mime_type, url: "artwork" }] }],
    } as ApiDropV2View;
    const { container } = render(<LatestDropNextMintSection drop={drop} />);
    const column = container.querySelector("[data-home-artwork-column]");
    expect(column?.querySelector("img")).toBeNull();
    expect(column).toHaveAttribute("data-home-artwork-is-image", isImage);
  }
);

describe("LatestDropNextMintSection", () => {
  it("links an explicitly mapped next drop to its Meme card", () => {
    render(<LatestDropNextMintSection drop={createDrop(488)} />);

    expect(
      screen.getByRole("link", { name: "The Memes #488" })
    ).toHaveAttribute("href", "/the-memes/488");
    expect(screen.queryByText(/Card #/)).not.toBeInTheDocument();
    expect(screen.getByTestId("subscribe")).toHaveAttribute(
      "data-token-id",
      "488"
    );
    expect(screen.getByTestId("allowlist-status")).toHaveAttribute(
      "data-token-id",
      "488"
    );
    expect(screen.getByText("Mint date")).toBeInTheDocument();
  });

  it("shows submitted and rating before the mint date", () => {
    render(<LatestDropNextMintSection drop={createDrop(488)} />);

    const submitted = screen.getByText("Submitted");
    const rating = screen.getByText("Rating");
    const mintDate = screen.getByText("Mint date");

    expect(
      submitted.compareDocumentPosition(mintDate) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      rating.compareDocumentPosition(mintDate) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("does not infer a card link when the next drop is unmapped", () => {
    render(<LatestDropNextMintSection drop={createDrop()} />);

    expect(
      screen.queryByRole("link", { name: /The Memes #/ })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Card #/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("allowlist-status")).not.toBeInTheDocument();
  });

  it("renders the mapped Meme pill as static text on its own detail page", () => {
    render(
      <LatestDropNextMintPanel drop={createDrop(488)} linkMemeCard={false} />
    );

    const pill = screen.getByText("The Memes #488");
    expect(pill.tagName).toBe("SPAN");
    expect(
      screen.queryByRole("link", { name: "The Memes #488" })
    ).not.toBeInTheDocument();
  });
});

it("fits Next Drop video into the same centered homepage area", () => {
  const drop = {
    ...createDrop(488),
    parts: [{ media: [{ mime_type: "video/mp4", url: "video.mp4" }] }],
  } as ApiDropV2View;
  render(<LatestDropNextMintSection drop={drop} />);
  expect(screen.getByTestId("drop-media")).toHaveAttribute("data-fill", "true");
  expect(
    screen.getByTestId("drop-media").closest("[data-home-artwork-column]")
  ).toHaveClass("tw-flex", "tw-items-center");
  expect(screen.getByTestId("drop-media")).toHaveAttribute(
    "data-align",
    "center"
  );
});

it("loads above-the-fold Next Drop media eagerly", () => {
  const drop = {
    ...createDrop(488),
    parts: [{ media: [{ mime_type: "image/png", url: "image.png" }] }],
  } as ApiDropV2View;

  render(<LatestDropNextMintSection drop={drop} />);

  expect(screen.getByTestId("drop-media")).toHaveAttribute(
    "data-load-strategy",
    "eager"
  );
});
