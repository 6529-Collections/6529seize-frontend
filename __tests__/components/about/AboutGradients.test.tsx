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

  it("preserves the artist link and original purpose wording", () => {
    render(<AboutGradients />);
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
