import { render, screen } from "@testing-library/react";
import NowMintingSection from "@/components/home/now-minting/NowMintingSection";
import HomeNftArtwork from "@/components/home/now-minting/HomeNftArtwork";
import NFTImage from "@/components/nft-image/NFTImage";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";

jest.mock("@/components/home/now-minting/NowMintingDetails", () => ({
  __esModule: true,
  default: () => <div>Details</div>,
}));

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

it.each(["MP4", "MOV"])("fits %s artwork into the homepage frame", (format) => {
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
});

it("centers Latest Drop artwork in its column without stretching the frame", () => {
  const nft = {
    id: 1,
    image: "poster.png",
    animation: "video.mp4",
    metadata: { animation_details: { format: "MP4" } },
  } as ApiMemesExtendedData;
  render(<NowMintingSection nft={nft} isFetching={false} />);
  const artwork = screen.getByTestId("artwork");
  expect(artwork.closest("[data-home-artwork-column]")).toHaveClass(
    "tw-flex",
    "tw-items-center"
  );
  expect(artwork.parentElement?.parentElement).not.toHaveClass(
    "tw-h-full",
    "lg:tw-h-full"
  );
});

it("lets the details determine the homepage still-image height", () => {
  render(
    <HomeNftArtwork
      nft={
        {
          id: 551,
          image: "portrait.png",
          animation: "",
          metadata: {
            image_details: { format: "PNG", width: 1000, height: 1400 },
          },
        } as ApiMemesExtendedData
      }
    />
  );
  expect(
    screen.getByTestId("artwork").parentElement?.parentElement
  ).toHaveClass("homeImageFrame");
  expect(jest.mocked(NFTImage).mock.calls.at(-1)?.[0]).toMatchObject({
    artworkLayout: true,
  });
});

it.each(["GIF", "SVG"])("fits %s animation artwork as an image", (format) => {
  render(
    <HomeNftArtwork
      nft={
        {
          id: 551,
          image: "poster.png",
          animation: `artwork.${format.toLowerCase()}`,
          metadata: { animation_details: { format } },
        } as ApiMemesExtendedData
      }
    />
  );
  expect(
    screen.getByTestId("artwork").parentElement?.parentElement
  ).toHaveClass("homeImageFrame");
  expect(jest.mocked(NFTImage).mock.calls.at(-1)?.[0]).toMatchObject({
    animation: true,
    artworkLayout: true,
  });
});
