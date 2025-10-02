import { render, screen } from "@testing-library/react";
import AppWalletAvatar from "@/components/app-wallets/AppWalletAvatar";

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
    expect(img).toHaveAttribute("src", `https://robohash.org/${address}.png`);
    expect(img).toHaveAttribute("alt", address);
    // height and width should default to 36
    expect(img).toHaveAttribute("height", "36");
    expect(img).toHaveAttribute("width", "36");
    expect(img).toHaveClass("appWalletAvatar");
    expect(img).toHaveAttribute("fetchPriority", "high");
    expect(img).toHaveAttribute("loading", "eager");
  });

  it("uses provided size for width and height", () => {
    render(<AppWalletAvatar address={address} size={50} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("height", "50");
    expect(img).toHaveAttribute("width", "50");
  });
});
