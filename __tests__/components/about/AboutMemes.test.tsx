import { fireEvent, render, screen } from "@testing-library/react";
import AboutMemes from "@/components/about/AboutMemes";

jest.mock("next/image", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    __esModule: true,
    default: React.forwardRef<
      HTMLImageElement,
      React.ImgHTMLAttributes<HTMLImageElement>
    >((props, ref) => <img alt={props.alt ?? ""} ref={ref} {...props} />),
  };
});

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
    expect(artwork).toHaveClass("tw-opacity-0");

    fireEvent.load(artwork);

    expect(artwork).toHaveClass("tw-opacity-100");
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

    const chat = screen.getByRole("link", {
      name: /The Memes chat on Brain/,
    });
    expect(chat).toHaveAttribute(
      "href",
      "/waves/0849642f-1770-4de2-9cbc-70aae59c17ff"
    );
    expect(chat).not.toHaveAttribute("target");
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
