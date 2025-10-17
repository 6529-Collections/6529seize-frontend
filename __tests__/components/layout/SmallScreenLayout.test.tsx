import { render, screen } from "@testing-library/react";
import React from "react";
import { HeaderProvider } from "@/contexts/HeaderContext";

const registerRef = jest.fn();
let pathname = "/";

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({ useLayout: () => ({ registerRef }) }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: null }),
}));
jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => ({ profile: null }),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
}));

const SmallScreenLayout = require("@/components/layout/SmallScreenLayout").default;

describe("SmallScreenLayout", () => {
  beforeEach(() => {
    registerRef.mockClear();
  });

  it("renders header and menu toggle on home page", async () => {
    pathname = "/";
    render(
      <HeaderProvider>
        <SmallScreenLayout>child</SmallScreenLayout>
      </HeaderProvider>
    );
    expect(await screen.findByAltText("6529Seize")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  it("still renders header on non-home page", async () => {
    pathname = "/page";
    render(
      <HeaderProvider>
        <SmallScreenLayout>child</SmallScreenLayout>
      </HeaderProvider>
    );
    expect(await screen.findByAltText("6529Seize")).toBeInTheDocument();
  });
});
