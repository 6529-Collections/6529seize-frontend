import { render, screen } from "@testing-library/react";
import HomeNftArtwork from "@/components/home/now-minting/HomeNftArtwork";
import NFTImage from "@/components/nft-image/NFTImage";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: false }),
}));

jest.mock("@/components/nft-image/NFTImage", () => ({
  __esModule: true,
  default: jest.fn(
    ({ artworkLayout }: { readonly artworkLayout?: boolean }) => (
      <div data-testid="artwork" data-fill={String(artworkLayout)} />
    )
  ),
}));

it.each(["MP4", "MOV", "PNG"])(
  "fits %s artwork into the homepage frame",
  (format) => {
    const nft = {
      id: 1,
      image: "poster.png",
      animation: "video.mp4",
      metadata: { animation_details: { format } },
    } as ApiMemesExtendedData;
    render(<HomeNftArtwork nft={nft} />);
    expect(screen.getByTestId("artwork")).toHaveAttribute("data-fill", "true");
    const frame = screen.getByTestId("artwork").parentElement!;
    expect(frame).not.toHaveClass("lg:tw-absolute", "lg:tw-h-full");
    expect(frame.parentElement).not.toHaveClass("lg:tw-h-full");
    const lastProps = jest.mocked(NFTImage).mock.calls.at(-1)?.[0];
    expect(lastProps).toMatchObject({
      animation: true,
      artworkLayout: true,
      showBalance: false,
    });
  }
);
