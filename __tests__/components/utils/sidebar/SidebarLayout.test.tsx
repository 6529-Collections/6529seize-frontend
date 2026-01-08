import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import SidebarLayout from "@/components/utils/sidebar/SidebarLayout";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { configureStore } from "@reduxjs/toolkit";
import { groupSlice } from "@/store/groupSlice";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));
jest.mock("@/hooks/useDeviceInfo");

jest.mock("@/components/utils/sidebar/SidebarLayoutApp", () => {
  return function SidebarLayoutApp({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div data-testid="sidebar-layout-app">{children}</div>;
  };
});

const useDeviceInfoMock = useDeviceInfo as jest.MockedFunction<
  typeof useDeviceInfo
>;

describe("SidebarLayout", () => {
  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();

    store = configureStore({
      reducer: {
        group: groupSlice.reducer,
      },
    });

    useDeviceInfoMock.mockReturnValue({
      isApp: false,
      isMobileDevice: false,
      hasTouchScreen: false,
    });
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <SidebarLayout>
          <div data-testid="test-content">Test Content</div>
        </SidebarLayout>
      </Provider>
    );
  };

  it("renders web layout by default", () => {
    renderComponent();

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar-layout-app")).not.toBeInTheDocument();
  });

  it("renders app layout when isApp is true", () => {
    useDeviceInfoMock.mockReturnValue({
      isApp: true,
      isMobileDevice: false,
      hasTouchScreen: false,
    });

    renderComponent();

    expect(screen.getByTestId("sidebar-layout-app")).toBeInTheDocument();
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

    const testStore = configureStore({
      reducer: {
        group: groupSlice.reducer,
      },
    });

    render(
      <Provider store={testStore}>
        <SidebarLayout>
          <div data-testid="test-content">Test Content</div>
        </SidebarLayout>
      </Provider>
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();

    const state = testStore.getState();
    expect(state.group.activeGroupId).toBe("test-group-id");
  });
});
