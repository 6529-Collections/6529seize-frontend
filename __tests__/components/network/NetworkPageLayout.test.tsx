import React from "react";
import { render, screen } from "@testing-library/react";
import NetworkPageLayout from "@/components/network/NetworkPageLayout";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  ActiveGroupProvider,
  useActiveGroup,
} from "@/contexts/ActiveGroupContext";

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

function ActiveGroupProbe() {
  const { activeGroupId } = useActiveGroup();
  return <div data-testid="active-group-id">{activeGroupId ?? "none"}</div>;
}

describe("NetworkPageLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useDeviceInfoMock.mockReturnValue({
      isApp: false,
      isMobileDevice: false,
      hasTouchScreen: false,
    });
  });

  const renderComponent = () => {
    return render(
      <ActiveGroupProvider>
        <NetworkPageLayout>
          <div data-testid="test-content">Test Content</div>
        </NetworkPageLayout>
      </ActiveGroupProvider>
    );
  };

  it("renders web layout by default", () => {
    renderComponent();

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
    expect(
      screen.queryByTestId("network-page-layout-app")
    ).not.toBeInTheDocument();
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

    render(
      <ActiveGroupProvider>
        <NetworkPageLayout>
          <div data-testid="test-content">Test Content</div>
        </NetworkPageLayout>
        <ActiveGroupProbe />
      </ActiveGroupProvider>
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
    expect(screen.getByTestId("active-group-id")).toHaveTextContent(
      "test-group-id"
    );
  });
});
