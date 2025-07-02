import { render, screen } from "@testing-library/react";
import AboutMemes from "../../../components/about/AboutMemes";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ""} {...props} />
  ),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

describe("AboutMemes", () => {
  it("renders heading and preview image", () => {
    render(<AboutMemes />);
    expect(
      screen.getByRole("heading", {
        name: /Memes Are The Most Important Thing In The World/i,
      })
    ).toBeInTheDocument();
    const img = screen.getByRole("img", { name: /The Memes/i });
    expect(img).toHaveAttribute("src", "/memes-preview.png");
  });

  it("links to resources", () => {
    render(<AboutMemes />);
    expect(
      screen.getByRole("link", { name: "6529.io/the-memes" })
    ).toHaveAttribute("href", "/the-memes");
    expect(
      screen.getByRole("link", { name: "6529.io/network" })
    ).toHaveAttribute("href", "/network");
  });
});
