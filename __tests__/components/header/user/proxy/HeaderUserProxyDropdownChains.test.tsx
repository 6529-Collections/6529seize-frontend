import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HeaderUserProxyDropdownChains from "@/components/header/user/proxy/HeaderUserProxyDropdownChains";

jest.mock("wagmi", () => ({
  useSwitchChain: jest.fn(),
  useConnections: jest.fn(),
}));
jest.mock("@/wagmiConfig/wagmiConfig", () => ({ getChains: jest.fn() }));

const { useSwitchChain, useConnections } = require("wagmi");
const { getChains } = require("@/wagmiConfig/wagmiConfig");

describe("HeaderUserProxyDropdownChains", () => {
  const switchChain = jest.fn();
  const onSwitchChain = jest.fn();

  beforeEach(() => {
    (useSwitchChain as jest.Mock).mockReturnValue({ switchChain });
    (useConnections as jest.Mock).mockReturnValue([{ chainId: 1 }]);
    jest.clearAllMocks();
  });

  it("renders nothing when only one chain is available", () => {
    (getChains as jest.Mock).mockReturnValue([{ id: 1, name: "Main" }]);
    const { container } = render(
      <HeaderUserProxyDropdownChains onSwitchChain={onSwitchChain} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("switches chain when button clicked", () => {
    (getChains as jest.Mock).mockReturnValue([
      { id: 1, name: "Main" },
      { id: 2, name: "Goerli" },
    ]);

    render(<HeaderUserProxyDropdownChains onSwitchChain={onSwitchChain} />);
    const button = screen.getByRole("button", { name: /switch to goerli/i });
    fireEvent.click(button);
    expect(onSwitchChain).toHaveBeenCalled();
    expect(switchChain).toHaveBeenCalledWith({ chainId: 2 });
  });

  it("handles switch errors gracefully", () => {
    switchChain.mockImplementation(() => {
      throw new Error("oops");
    });
    (getChains as jest.Mock).mockReturnValue([
      { id: 1, name: "Main" },
      { id: 2, name: "Goerli" },
    ]);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<HeaderUserProxyDropdownChains onSwitchChain={onSwitchChain} />);
    fireEvent.click(screen.getByRole("button", { name: /switch to goerli/i }));
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
