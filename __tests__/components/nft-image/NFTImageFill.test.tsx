import { render, screen } from "@testing-library/react";
import NFTImage from "@/components/nft-image/NFTImage";
import type { BaseRendererProps } from "@/components/nft-image/types/renderer-props";

jest.mock("@/components/nft-image/renderers/NFTHTMLRenderer", () => () => null);
jest.mock(
  "@/components/nft-image/renderers/NFTModelRenderer",
  () => () => null
);
jest.mock(
  "@/components/nft-image/renderers/NFTImageRenderer",
  () =>
    function ImageRenderer(props: BaseRendererProps) {
      return (
        <div
          data-testid="image"
          data-fill={props.fillContainer}
          data-artwork={props.artworkLayout}
          className={props.bgStyle}
        />
      );
    }
);
jest.mock(
  "@/components/nft-image/renderers/NFTVideoRenderer",
  () =>
    function VideoRenderer(props: BaseRendererProps) {
      return (
        <div
          data-testid="video"
          data-fill={props.fillContainer}
          data-artwork={props.artworkLayout}
          className={props.bgStyle}
        />
      );
    }
);

it.each(["image", "video"] as const)(
  "forwards contained-frame and transparent background props to the %s renderer",
  (mediaType) => {
    const nft = {
      id: 1,
      contract: "0x123",
      name: "Artwork",
      icon: "image.png",
      image: "image.png",
      thumbnail: "image.png",
      scaled: "image.png",
      animation: mediaType === "video" ? "video.mp4" : "",
      metadata: {
        animation_details: { format: mediaType === "video" ? "MP4" : "PNG" },
      },
    };
    render(
      <NFTImage
        nft={nft}
        animation
        fillContainer
        artworkLayout
        transparentBG
        height={650}
        showBalance={false}
      />
    );
    expect(screen.getByTestId(mediaType)).toHaveAttribute("data-fill", "true");
    expect(screen.getByTestId(mediaType)).toHaveAttribute(
      "data-artwork",
      "true"
    );
    expect(screen.getByTestId(mediaType)).toHaveClass("transparentBG");
  }
);
