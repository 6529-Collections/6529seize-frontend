import { render, screen } from "@testing-library/react";
import AboutMemeLab from "@/components/about/AboutMemeLab";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => (
    <span aria-label={alt} data-src={src} role="img" />
  ),
}));

describe("AboutMemeLab", () => {
  it("renders the collection heading and artwork", () => {
    render(<AboutMemeLab />);
    expect(
      screen.getByRole("heading", { name: "Meme Lab", level: 1 })
    ).toBeInTheDocument();
    const img = screen.getByRole("img", { name: "Meme Lab" });
    expect(img).toHaveAttribute("data-src", "/memelab.png");
  });

  it("preserves the original contract wording", () => {
    render(<AboutMemeLab />);
    expect(
      screen.getByText(
        "The Meme Lab is an experimental CC0 contract for artists who have already minted a Meme Card. They can use the Meme Lab contract to mint NFTs that they like, in any way that they like."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "We actively encourage the artists to experiment on any dimension they like on the Meme Lab's contract - artistic, community, edition size, price and so on."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "We will learn more in the next 6 months about how artists plan to use it and what happens."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "We hope to see some successes, and certainly expect there will be some failures too."
      )
    ).toBeInTheDocument();
  });
});
