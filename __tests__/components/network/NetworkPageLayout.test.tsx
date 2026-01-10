import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import NetworkPageLayout from "@/components/network/NetworkPageLayout";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { configureStore } from "@reduxjs/toolkit";
import { groupSlice } from "@/store/groupSlice";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));
jest.mock("@/hooks/useDeviceInfo");

jest.mock("@/components/network/NetworkPageLayoutApp", () => {
  return function NetworkPageLayoutApp({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div data-testid="network-page-layout-app">{children}</div>;
  };
});

const useDeviceInfoMock = useDeviceInfo as jest.MockedFunction<
  typeof useDeviceInfo
>;

const createTestStore = () =>
  configureStore({
    reducer: {
      group: groupSlice.reducer,
    },
  });

type TestStore = ReturnType<typeof createTestStore>;

describe("NetworkPageLayout", () => {
  let store: TestStore;

  beforeEach(() => {
    jest.clearAllMocks();

    store = createTestStore();

    useDeviceInfoMock.mockReturnValue({
      isApp: false,
      isMobileDevice: false,
      hasTouchScreen: false,
    });
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <NetworkPageLayout>
          <div data-testid="test-content">Test Content</div>
        </NetworkPageLayout>
      </Provider>
    );
  };

  it("renders web layout by default", () => {
    renderComponent();

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
    expect(screen.queryByTestId("network-page-layout-app")).not.toBeInTheDocument();
  });

  it("renders app layout when isApp is true", () => {
    useDeviceInfoMock.mockReturnValue({
      isApp: true,
      isMobileDevice: false,
      hasTouchScreen: false,
    });

    renderComponent();

    expect(screen.getByTestId("network-page-layout-app")).toBeInTheDocument();
    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("renders children in web layout", () => {
    renderComponent();

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("initializes with group from router query", () => {
    const { useSearchParams } = require("next/navigation");
    useSearchParams.mockReturnValue(
      new URLSearchParams({ group: "test-group-id" })
    );

    const testStore = createTestStore();

    render(
      <Provider store={testStore}>
        <NetworkPageLayout>
          <div data-testid="test-content">Test Content</div>
        </NetworkPageLayout>
      </Provider>
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();

    const state = testStore.getState();
    expect(state.group.activeGroupId).toBe("test-group-id");
  });
});
