import { render, screen } from "@testing-library/react";
import NFTImage from "../../components/nft-image/NFTImage";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ""} {...props} />
  ),
}));

const baseNft: any = {
  id: 1,
  name: "nft",
  image: "img.png",
  scaled: "scaled.png",
  thumbnail: "thumb.png",
  metadata: {
    image: "meta.png",
  },
};

describe("NFTImage", () => {
  it("renders image fallback", () => {
    render(
      <NFTImage
        nft={baseNft}
        animation={false}
        height={300}
        balance={1}
        showUnseized={false}
      />
    );
    expect(screen.getByRole("img")).toHaveAttribute("src", baseNft.scaled);
  });
});
