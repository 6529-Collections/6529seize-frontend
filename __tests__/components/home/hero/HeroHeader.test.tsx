import HeroHeader from "@/components/home/hero/HeroHeader";
import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("HeroHeader", () => {
  it("renders the hero heading copy", () => {
    render(<HeroHeader />);

    expect(
      screen.getByRole("heading", {
        name: "Building a decentralized network state",
      })
    ).toBeInTheDocument();
  });

  it("renders a quick link to network health", () => {
    render(<HeroHeader />);

    const healthLink = screen.getByRole("link", {
      name: "Open network health dashboard",
    });

    expect(healthLink).toHaveAttribute("href", "/network/health");
  });
});
