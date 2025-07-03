import { render, screen } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { editSlice } from "../../../store/editSlice";

const useViewContext = jest.fn();
const registerRef = jest.fn();
const setHeaderRef = jest.fn();
const usePathname = jest.fn();
const useSearchParams = jest.fn();

jest.mock("next/dynamic", () => () => () => <div data-testid="header" />);
jest.mock("@/components/navigation/ViewContext", () => ({
  useViewContext: () => useViewContext(),
}));
jest.mock("@/components/navigation/BottomNavigation", () => () => (
  <div data-testid="bottom-nav" />
));
jest.mock("@/components/brain/mobile/BrainMobileWaves", () => () => (
  <div data-testid="waves" />
));
jest.mock("@/components/brain/mobile/BrainMobileMessages", () => () => (
  <div data-testid="messages" />
));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ registerRef }),
}));
jest.mock("@/contexts/HeaderContext", () => ({
  useHeaderContext: () => ({ setHeaderRef }),
}));
jest.mock("@/hooks/useDeepLinkNavigation", () => ({
  useDeepLinkNavigation: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useSearchParams: () => useSearchParams(),
}));

const AppLayout = require("@/components/layout/AppLayout").default;

describe("AppLayout", () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: { edit: editSlice.reducer },
    });
    usePathname.mockReturnValue("/");
    useSearchParams.mockReturnValue({ get: () => null } as any);
  });

  const renderWithProvider = (children: React.ReactElement) => {
    return render(<Provider store={store}>{children}</Provider>);
  };

  it("renders main content when no active view", () => {
    useViewContext.mockReturnValue({ activeView: null });
    renderWithProvider(<AppLayout>child</AppLayout>);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav")).toBeInTheDocument();
  });

  it("renders waves or messages view based on activeView", () => {
    useViewContext.mockReturnValue({ activeView: "waves" });
    const { rerender } = renderWithProvider(<AppLayout>child</AppLayout>);
    expect(screen.getByTestId("waves")).toBeInTheDocument();

    useViewContext.mockReturnValue({ activeView: "messages" });
    rerender(
      <Provider store={store}>
        <AppLayout>child</AppLayout>
      </Provider>
    );
    expect(screen.getByTestId("messages")).toBeInTheDocument();
  });
});
