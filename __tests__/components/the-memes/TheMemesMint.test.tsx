import TheMemesMint from "@/components/the-memes/TheMemesMint";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { render, screen } from "@testing-library/react";

jest.mock("next/dynamic", () => () => {
  return function MockManifoldMinting({
    animationSrc,
  }: {
    readonly animationSrc?: string | null;
  }) {
    return <div data-testid="mint-artwork" data-animation-src={animationSrc} />;
  };
});

jest.mock("@/components/drop-forge/drop-forge-config", () => ({
  useDropForgeMintingConfig: () => ({ contract: "0x123", chain: { id: 1 } }),
}));

jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({ setTitle: jest.fn() }),
}));

describe("TheMemesMint artwork", () => {
  it("passes each mint's API animation instead of its metadata or derivative", () => {
    const nft = {
      id: 123,
      name: "First film",
      animation: "https://cdn.example/videos/123.MP4",
      compressed_animation: "https://cdn.example/scaledx750/123.MP4",
      metadata: { animation_url: "https://arweave.net/first-film" },
      mint_date: null,
    } as ApiMemesExtendedData;
    const { rerender } = render(<TheMemesMint nft={nft} />);

    expect(screen.getByTestId("mint-artwork")).toHaveAttribute(
      "data-animation-src",
      nft.animation
    );

    const nextNft = {
      ...nft,
      id: 124,
      name: "Next film",
      animation: "https://cdn.example/videos/124.MP4",
    };
    rerender(<TheMemesMint nft={nextNft} />);

    expect(screen.getByTestId("mint-artwork")).toHaveAttribute(
      "data-animation-src",
      nextNft.animation
    );
  });
});
