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

  it("preserves the contract overview and collection action", () => {
    render(<AboutMemeLab />);
    expect(
      screen.getByText(/^The Meme Lab is an experimental CC0 contract/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /explore meme lab/i })
    ).toHaveAttribute("href", "/meme-lab");
    expect(
      screen.getByRole("heading", { name: "How Artists Use the Lab" })
    ).toBeInTheDocument();
  });
});
