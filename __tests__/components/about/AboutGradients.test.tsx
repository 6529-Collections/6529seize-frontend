import { render, screen } from "@testing-library/react";
import AboutGradients from "@/components/about/AboutGradients";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => (
    <span aria-label={alt} data-src={src} role="img" />
  ),
}));

describe("AboutGradients", () => {
  it("renders the collection heading and preview", () => {
    render(<AboutGradients />);
    expect(
      screen.getByRole("heading", {
        name: "6529 Gradient Collection",
        level: 1,
      })
    ).toBeInTheDocument();
    const img = screen.getByRole("img", { name: "6529 Gradient" });
    expect(img).toHaveAttribute("data-src", "/gradients-preview.png");
  });

  it("preserves the original collection wording and artist link", () => {
    render(<AboutGradients />);
    const originalCopy = [
      "The Gradient Collection is a collection of 101 NFTs. They were auctioned to collectors in 2021 and 2022.",
      "Gradients #0, #50 and #100 are in the 6529 Museum Permanent Collection.",
      "Gradients #10, #20, #30, #40, #50, #60, #70, #80, #90 will be held by 6529 Museum for now.",
      "The 6529 Gradient Collection represents the 6529 symbol in its original two stark black (#100) and white (#0) forms as well 98 grayscale gradients in-between. Each grayscale gradient is a 1% increment in darkness between 100% black and 100% white, with the background switching from white to black from #49 to #51.",
      "It is the artist's (@6529er) preferred interpretation of his work and his vision for it in its purest form. It reminds us of the Chromie Squiggles Perfect Spectrums - much less flashy than the HyperRainbows, but it is an iykyk choice.",
      "Each of the 100 pieces is represented as a 100% on-chain SVG with a secondary IPFS link.",
      "The more mathematically inclined readers will note that #0 to #100 represents 101 tokens, not 100. That is right, there is a special token, #50 that is built different. It is a gif (how could we not have a gif?) and, like the squiggles, it moves.",
      "The Gradients do not do anything. They are a graphic expression of the 6529 logo.",
      "We encourage social experimentation in the Gradient community, as the collectors are likely to be strong supporters of decentralization.",
    ];

    for (const copy of originalCopy) {
      expect(document.body).toHaveTextContent(copy);
    }

    expect(screen.getByRole("link", { name: "@6529er" })).toHaveAttribute(
      "href",
      "https://x.com/6529er"
    );
    expect(
      screen.getByRole("heading", {
        name: "What Do The Gradients Do?",
        level: 2,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The Gradients do not do anything. They are a graphic expression of the 6529 logo."
      )
    ).toBeInTheDocument();
  });
});
