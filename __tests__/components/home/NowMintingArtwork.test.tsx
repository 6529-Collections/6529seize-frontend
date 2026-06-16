import NowMintingArtwork from "@/components/home/now-minting/NowMintingArtwork";
import { render, screen } from "@testing-library/react";

const mockNFTImage = jest.fn((props: any) => (
  <div
    data-testid="nft-image"
    data-use-drop-video-player={String(Boolean(props.useDropVideoPlayer))}
  />
));

jest.mock("@/components/nft-image/NFTImage", () => ({
  __esModule: true,
  default: (props: any) => mockNFTImage(props),
}));

jest.mock("@/hooks/useDeviceInfo", () => () => ({
  hasTouchScreen: false,
}));

const baseNft = {
  id: 667,
  name: "All the roads lead to OM",
  image: "https://media.example/image.png",
  animation: "https://media.example/video.mp4",
  metadata: {
    image: "https://media.example/image.png",
    animation: "https://media.example/video.mp4",
    animation_details: { format: "MP4" },
  },
};

describe("NowMintingArtwork", () => {
  beforeEach(() => {
    mockNFTImage.mockClear();
  });

  it("opts latest-drop artwork into the drop video player", () => {
    render(<NowMintingArtwork nft={baseNft as any} />);

    expect(screen.getByTestId("nft-image")).toHaveAttribute(
      "data-use-drop-video-player",
      "true"
    );
  });
});
