import { render, screen } from "@testing-library/react";
import React from "react";

const registerRef = jest.fn();
let pathname = "/";

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({ useLayout: () => ({ registerRef }) }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: null }),
}));
jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => ({ profile: null }),
}));
jest.mock("@/components/debug/LayoutDebugOverlay", () => () => null);
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
}));

const SmallScreenLayout = require("@/components/layout/SmallScreenLayout").default;

describe("SmallScreenLayout", () => {
  beforeEach(() => {
    registerRef.mockClear();
  });

  it("renders header and menu toggle on home page", () => {
    pathname = "/";
    render(<SmallScreenLayout>child</SmallScreenLayout>);
    expect(registerRef).toHaveBeenCalledWith("header", expect.any(HTMLElement));
    expect(screen.getByAltText("6529Seize")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  it("still renders header on non-home page", () => {
    pathname = "/page";
    render(<SmallScreenLayout>child</SmallScreenLayout>);
    expect(registerRef).toHaveBeenCalledWith("header", expect.any(HTMLElement));
    expect(screen.getByAltText("6529Seize")).toBeInTheDocument();
  });
});
