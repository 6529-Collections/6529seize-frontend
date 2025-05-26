import { render, screen } from "@testing-library/react";
import React from "react";

const registerRef = jest.fn();
const setHeaderRef = jest.fn();
const useBreadcrumbs = jest.fn(() => [{ display: "Home", href: "/" }]);
let pathname = "/";

jest.mock("next/dynamic", () => () => () => <div data-testid="header" />);
jest.mock("../../../hooks/useBreadcrumbs", () => ({ useBreadcrumbs }));
jest.mock("../../../contexts/HeaderContext", () => ({ useHeaderContext: () => ({ setHeaderRef }) }));
jest.mock("../../../components/brain/my-stream/layout/LayoutContext", () => ({ useLayout: () => ({ registerRef }) }));
jest.mock("next/router", () => ({ useRouter: () => ({ pathname }) }));

const SmallScreenLayout = require("../../../components/layout/SmallScreenLayout").default;

describe("SmallScreenLayout", () => {
  beforeEach(() => {
    registerRef.mockClear();
    setHeaderRef.mockClear();
  });

  it("renders header without breadcrumb on home page", () => {
    pathname = "/";
    render(<SmallScreenLayout>child</SmallScreenLayout>);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(registerRef).toHaveBeenCalledWith("header", expect.any(HTMLElement));
    expect(setHeaderRef).toHaveBeenCalledWith(expect.any(HTMLElement));
  });

  it("shows breadcrumb when not on home page", () => {
    pathname = "/page";
    render(<SmallScreenLayout>child</SmallScreenLayout>);
    expect(screen.getByText("Home")).toBeInTheDocument();
  });
});
