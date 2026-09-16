import { render, screen } from "@testing-library/react";
import React from "react";
import { HeaderProvider } from "@/contexts/HeaderContext";

const registerRef = jest.fn();
let pathname = "/";

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ registerRef }),
}));
jest.mock("@/components/layout/sidebar/WebSidebar", () => ({
  __esModule: true,
  default: () => <div data-testid="web-sidebar" />,
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: null }),
}));
jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => ({ profile: null }),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const SmallScreenLayout =
  require("@/components/layout/SmallScreenLayout").default;

describe("SmallScreenLayout", () => {
  beforeEach(() => {
    registerRef.mockClear();
  });

  it("places the app banner above navigation inside the measured header", () => {
    pathname = "/";
    localStorage.clear();
    const userAgent = jest
      .spyOn(navigator, "userAgent", "get")
      .mockReturnValue("iPhone Safari");
    try {
      render(
        <HeaderProvider>
          <SmallScreenLayout>child</SmallScreenLayout>
        </HeaderProvider>
      );
      const banner = screen.getByRole("complementary", {
        name: "Open in 6529 Mobile",
      });
      const header = registerRef.mock.calls.find(
        ([name, element]) => name === "header" && element
      )?.[1];
      expect(header).toContainElement(banner);
      expect(header.firstElementChild).toBe(banner);
      expect(banner.nextElementSibling?.tagName).toBe("HEADER");
    } finally {
      userAgent.mockRestore();
    }
  });

  it("renders header and menu toggle on home page", async () => {
    pathname = "/";
    render(
      <HeaderProvider>
        <SmallScreenLayout>child</SmallScreenLayout>
      </HeaderProvider>
    );
    expect(await screen.findByAltText("6529Seize")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Search 6529" })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Open menu" })
    ).toBeInTheDocument();
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
