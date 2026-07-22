import { fireEvent, render, screen } from "@testing-library/react";
import AboutMemes from "@/components/about/AboutMemes";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ""} {...props} />
  ),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));

describe("AboutMemes", () => {
  it("renders the heading and selected Meme artwork", () => {
    render(<AboutMemes />);
    expect(
      screen.getByRole("heading", {
        name: /Memes Are The Most Important Thing In The World/i,
      })
    ).toBeInTheDocument();

    const artworkLink = screen.getByRole("link", {
      name: "View Awakening OM, Meme Card #17",
    });
    expect(artworkLink).toHaveAttribute("href", "/the-memes/17");

    const artwork = screen.getByRole("img", {
      name: "Awakening OM, Meme Card #17",
    });
    expect(artwork).toHaveAttribute("src", expect.stringContaining("/17.WEBP"));
  });

  it("preserves resource destinations and new-tab behavior", () => {
    render(<AboutMemes />);

    const collection = screen.getByRole("link", {
      name: "Open All The Memes in a new tab",
    });
    expect(collection).toHaveAttribute("href", "/the-memes");
    expect(collection).toHaveAttribute("target", "_blank");
    expect(collection).toHaveAttribute("rel", "noopener noreferrer");

    const network = screen.getByRole("link", {
      name: "Open The Memes Network in a new tab",
    });
    expect(network).toHaveAttribute("href", "/network");
    expect(network).toHaveAttribute("target", "_blank");
  });

  it("shows a resilient fallback when artwork fails to load", () => {
    render(<AboutMemes />);

    fireEvent.error(
      screen.getByRole("img", {
        name: "Awakening OM, Meme Card #17",
      })
    );

    expect(
      screen.getByRole("img", {
        name: "Awakening OM, Meme Card #17",
      })
    ).toHaveTextContent("Artwork unavailable");
  });
});
