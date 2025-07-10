import { render, screen, fireEvent } from "@testing-library/react";
import HeaderOpenMobile from "@/components/header/open-mobile/HeaderOpenMobile";
import React from "react";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/hooks/isMobileDevice", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const { useRouter, usePathname } = require("next/navigation");
const useCapacitor = require("@/hooks/useCapacitor").default as jest.Mock;
const useIsMobileDevice = require("@/hooks/isMobileDevice")
  .default as jest.Mock;

describe("HeaderOpenMobile", () => {
  afterEach(() => jest.clearAllMocks());

  it("does not render when running in capacitor", () => {
    useCapacitor.mockReturnValue({ isCapacitor: true });
    useIsMobileDevice.mockReturnValue(true);
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push,
    });
    usePathname.mockReturnValue("/path");
    const { container } = render(<HeaderOpenMobile />);
    expect(container.firstChild).toBeNull();
  });

  it("opens mobile link when clicked", () => {
    useCapacitor.mockReturnValue({ isCapacitor: false });
    useIsMobileDevice.mockReturnValue(true);
    usePathname.mockReturnValue("/foo");
    const open = jest.fn();
    const original = window.open;
    // @ts-ignore
    window.open = open;

    render(<HeaderOpenMobile />);
    const btn = screen.getByRole("button", { name: "Open Mobile" });
    fireEvent.click(btn);
    expect(open).toHaveBeenCalledWith(
      `${window.location.origin}/open-mobile?path=%2Ffoo`,
      "_blank"
    );

    window.open = original;
  });
});
