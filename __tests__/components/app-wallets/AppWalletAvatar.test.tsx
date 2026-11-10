import { render, screen } from "@testing-library/react";
import AppWalletAvatar from "@/components/app-wallets/AppWalletAvatar";
import { getAppWalletAvatarDataUri } from "@/helpers/app-wallet-avatar.helpers";

// Mock next/image to render a regular img element
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => (
    <img {...props} alt={props.alt ?? "app-wallet-avatar"} />
  ),
}));

describe("AppWalletAvatar", () => {
  const address = "0xabc";

  it("renders avatar with default size", () => {
    render(<AppWalletAvatar address={address} />);
    const img = screen.getByRole("img");
    const src = img.getAttribute("src") ?? "";
    expect(src.startsWith("data:image/svg+xml")).toBe(true);
    expect(src).not.toContain(address);
    expect(img).toHaveAttribute("alt", address);
    // height and width should default to 36
    expect(img).toHaveAttribute("height", "36");
    expect(img).toHaveAttribute("width", "36");
    expect(img).toHaveClass(
      "tw-rounded-full",
      "tw-border-white/10",
      "tw-bg-black/30"
    );
    expect(img).toHaveAttribute("fetchPriority", "high");
    expect(img).toHaveAttribute("loading", "eager");
  });

  it("uses provided size for width and height", () => {
    render(<AppWalletAvatar address={address} size={50} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("height", "50");
    expect(img).toHaveAttribute("width", "50");
  });

  it("renders locally without a network request", () => {
    const { container } = render(<AppWalletAvatar address={address} />);
    expect(container.innerHTML).not.toMatch(/https?:\/\//);
    expect(container.innerHTML).not.toContain("robohash");
  });

  it("gives the same address the same avatar and different addresses different ones", () => {
    const first = "0x1111111111111111111111111111111111111111";
    const second = "0x2222222222222222222222222222222222222222";
    const { rerender } = render(<AppWalletAvatar address={first} />);
    const firstSrc = screen.getByRole("img").getAttribute("src");
    rerender(
      <AppWalletAvatar address={first.toUpperCase().replace("0X", "0x")} />
    );
    expect(screen.getByRole("img").getAttribute("src")).toBe(firstSrc);
    rerender(<AppWalletAvatar address={second} />);
    expect(screen.getByRole("img").getAttribute("src")).not.toBe(firstSrc);
    expect(getAppWalletAvatarDataUri(second)).toBe(
      getAppWalletAvatarDataUri(second)
    );
  });
});
