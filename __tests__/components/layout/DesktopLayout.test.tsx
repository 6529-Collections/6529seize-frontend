import { render, screen } from "@testing-library/react";
import React from "react";

const registerRef = jest.fn();
const setHeaderRef = jest.fn();
let pathname = "/";

jest.mock("next/dynamic", () => () => () => <div data-testid="header" />);
jest.mock("@/hooks/useBreadcrumbs", () => ({
  useBreadcrumbs: () => [{ display: "Home", href: "/" }],
}));
jest.mock("@/contexts/HeaderContext", () => ({
  useHeaderContext: () => ({ setHeaderRef }),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ registerRef }),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

const WebLayout = require("@/components/layout/WebLayout").default;

describe("WebLayout", () => {
  beforeEach(() => {
    registerRef.mockClear();
    setHeaderRef.mockClear();
  });

  it("renders header without breadcrumb on home page", () => {
    pathname = "/";
    render(<WebLayout>child</WebLayout>);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(registerRef).toHaveBeenCalledWith("header", expect.any(HTMLElement));
    expect(setHeaderRef).toHaveBeenCalledWith(expect.any(HTMLElement));
  });

  it("shows breadcrumb when not on home page", () => {
    pathname = "/page";
    render(<WebLayout>child</WebLayout>);
    expect(screen.getByText("Home")).toBeInTheDocument();
    const wrapper = screen.getByTestId("header").parentElement as HTMLElement;
    expect(wrapper.className).not.toContain("tw-sticky");
  });

  it("adds sticky classes for stream view", () => {
    pathname = "/my-stream/test";
    render(<WebLayout>child</WebLayout>);
    const wrapper = screen.getByTestId("header").parentElement as HTMLElement;
    expect(wrapper.className).toContain("tw-sticky");
  });
});
