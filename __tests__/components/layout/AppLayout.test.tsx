import { render, screen } from "@testing-library/react";
import React from "react";

const useViewContext = jest.fn();
const registerRef = jest.fn();
const setHeaderRef = jest.fn();
const useRouter = jest.fn();

jest.mock("next/dynamic", () => () => () => <div data-testid="header" />);
jest.mock("../../../components/navigation/ViewContext", () => ({
  useViewContext: () => useViewContext(),
}));
jest.mock("../../../components/navigation/BottomNavigation", () => () => <div data-testid="bottom-nav" />);
jest.mock("../../../components/brain/mobile/BrainMobileWaves", () => () => <div data-testid="waves" />);
jest.mock("../../../components/brain/mobile/BrainMobileMessages", () => () => <div data-testid="messages" />);
jest.mock("../../../components/brain/my-stream/layout/LayoutContext", () => ({ useLayout: () => ({ registerRef }) }));
jest.mock("../../../contexts/HeaderContext", () => ({ useHeaderContext: () => ({ setHeaderRef }) }));
jest.mock("../../../hooks/useDeepLinkNavigation", () => ({ useDeepLinkNavigation: jest.fn() }));
jest.mock("next/router", () => ({ useRouter: () => useRouter() }));

const AppLayout = require("../../../components/layout/AppLayout").default;

describe("AppLayout", () => {
  beforeEach(() => {
    useRouter.mockReturnValue({ pathname: "/", query: {}, push: jest.fn() });
  });

  it("renders main content when no active view", () => {
    useViewContext.mockReturnValue({ activeView: null });
    render(<AppLayout>child</AppLayout>);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav")).toBeInTheDocument();
  });

  it("renders waves or messages view based on activeView", () => {
    useViewContext.mockReturnValue({ activeView: "waves" });
    const { rerender } = render(<AppLayout>child</AppLayout>);
    expect(screen.getByTestId("waves")).toBeInTheDocument();

    useViewContext.mockReturnValue({ activeView: "messages" });
    rerender(<AppLayout>child</AppLayout>);
    expect(screen.getByTestId("messages")).toBeInTheDocument();
  });
});
