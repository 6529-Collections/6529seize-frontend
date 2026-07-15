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
