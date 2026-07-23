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
    const img = screen.getByRole("img", { name: /6529 Gradient artwork/i });
    expect(img).toHaveAttribute("data-src", "/gradients-preview.png");
  });

  it("links to the collection, artist, and animated token", () => {
    render(<AboutGradients />);
    expect(
      screen.getByRole("link", { name: /explore 6529 gradient/i })
    ).toHaveAttribute("href", "/6529-gradient");
    expect(
      screen.getByRole("link", { name: /follow 6529er on x/i })
    ).toHaveAttribute("href", "https://x.com/6529er");
    expect(
      screen.getByRole("link", { name: /view gradient #50/i })
    ).toHaveAttribute("href", "/6529-gradient/50");
  });
});
