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

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

describe("HeroHeader", () => {
  it("renders the hero heading copy without artwork", () => {
    const { container } = render(<HeroHeader />);

    const heading = screen.getByRole("heading", {
      name: "A peer-to-peer protocol for network organizations",
    });

    expect(heading).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(
      screen.getByText(
        "Decentralized, permissionless, and global. Anyone can fund, build, and coordinate network-scaled organizations or public goods."
      )
    ).toBeInTheDocument();
    expect(heading).toHaveClass("tw-font-semibold");
    expect(heading).not.toHaveClass("tw-font-medium");
  });

  it("keeps hyphenated headline words together", () => {
    render(<HeroHeader />);

    const heading = screen.getByRole("heading", { level: 1 });
    const unbroken = heading.querySelector(".tw-inline-block");

    expect(heading).toHaveTextContent(
      "A peer-to-peer protocol for network organizations"
    );
    expect(unbroken).toHaveTextContent("peer-to-peer");
  });

  it("renders a quick link to network health", () => {
    render(<HeroHeader />);

    const healthLink = screen.getByRole("link", {
      name: "Open network health dashboard",
    });

    expect(healthLink).toHaveAttribute("href", "/network/health");
  });

  it("hides the fixed health link inside the native app shell", () => {
    render(<HeroHeader />);

    expect(
      screen.getByRole("link", {
        name: "Open network health dashboard",
      })
    ).toHaveClass("[.capacitor-native_&]:tw-hidden");
  });
});
