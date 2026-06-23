import NFTMediaContainer from "@/components/nft-image/NFTMediaContainer";
import { render, screen } from "@testing-library/react";

describe("NFTMediaContainer", () => {
  it("uses a normal Tailwind iron background by default", () => {
    render(
      <NFTMediaContainer>
        <span>media</span>
      </NFTMediaContainer>
    );

    expect(screen.getByText("media").parentElement).toHaveClass(
      "tw-bg-iron-900"
    );
  });

  it("keeps caller classes available for transparent background overrides", () => {
    render(
      <NFTMediaContainer className="transparentBG">
        <span>media</span>
      </NFTMediaContainer>
    );

    expect(screen.getByText("media").parentElement).toHaveClass(
      "tw-bg-iron-900",
      "transparentBG"
    );
  });
});
