import { render, screen } from "@testing-library/react";
import HeaderUserProfile from "../../../../components/header/user/HeaderUserProfile";
import React from "react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

jest.mock("@tippyjs/react", () => (props: any) => (
  <div data-testid="tippy" data-content={props.content}>
    {props.children}
  </div>
));

jest.mock("../../../../components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../../../components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

const { useAuth } = require("../../../../components/auth/Auth");
const {
  useSeizeConnectContext,
} = require("../../../../components/auth/SeizeConnectContext");

function setup(options: any) {
  (useAuth as jest.Mock).mockReturnValue({
    activeProfileProxy: options.activeProfileProxy,
  });
  (useSeizeConnectContext as jest.Mock).mockReturnValue({
    address: options.address,
    isConnected: options.isConnected,
  });
  render(<HeaderUserProfile profile={options.profile} />);
}

describe("HeaderUserProfile", () => {
  afterEach(() => jest.clearAllMocks());

  it("uses proxy information when active", () => {
    const proxy = { created_by: { handle: "proxy", pfp: "proxy.png" } };
    const profile = { handle: "alice", pfp: "alice.png" };
    setup({
      activeProfileProxy: proxy,
      profile,
      address: "0x1234",
      isConnected: true,
    });

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/proxy");
    expect(screen.getByText("proxy")).toBeInTheDocument();
    expect(screen.getByText("Proxy")).toBeInTheDocument();
    expect(link.querySelector("img")!).toHaveAttribute("src", "proxy.png");
    expect(screen.getByTestId("tippy")).toHaveAttribute(
      "data-content",
      "Connected and Authenticated",
    );
  });

  it("falls back to profile when no proxy", () => {
    const profile = { handle: "alice", pfp: "alice.png" };
    setup({
      activeProfileProxy: null,
      profile,
      address: "0x1234",
      isConnected: false,
    });

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/alice");
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(link.querySelector("img")!).toHaveAttribute("src", "alice.png");
    expect(screen.queryByText("Proxy")).toBeNull();
    expect(screen.getByTestId("tippy")).toHaveAttribute(
      "data-content",
      "Authenticated (wallet not connected)",
    );
  });

  it("uses wallet display and address when no handle", () => {
    const profile = { wallets: [{ wallet: "0xabcd", display: "Bob" }] };
    setup({
      activeProfileProxy: null,
      profile,
      address: "0xabcd",
      isConnected: true,
    });

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/Bob");
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(link.querySelector("img")).toBeNull();
  });

  it("falls back to address when no display", () => {
    const profile = { wallets: [{ wallet: "0xabcde" }] };
    setup({
      activeProfileProxy: null,
      profile,
      address: "0xabcde",
      isConnected: false,
    });

    const label = "0xabcde".slice(0, 6);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/0xabcde`);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
