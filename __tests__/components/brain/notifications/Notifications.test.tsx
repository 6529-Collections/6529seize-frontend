import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";

const mutateAsyncMock = jest.fn();
const requestAuthMock = jest.fn().mockResolvedValue({ success: true });
const setActiveProfileProxyMock = jest.fn().mockResolvedValue(undefined);
const setToastMock = jest.fn();
const mockMarkMobileLaunchStep = jest.fn();
const mockScheduleMobileLaunchFlush = jest.fn();
const mockAuthContextValue = {
  connectedProfile: { handle: "bob", id: "1" } as {
    handle: string;
    id: string;
  } | null,
  isAuthenticated: true,
  activeProfileProxy: null,
  fetchingProfile: false,
  requestAuth: requestAuthMock,
  setToast: setToastMock,
  setActiveProfileProxy: setActiveProfileProxyMock,
};
const mockSeizeConnectContextValue = {
  address: "0x00000000000000000000000000000000000000AA" as string | undefined,
  isSigningOutAll: false,
};

interface MockMutationConfig {
  readonly onError?:
    | ((error: unknown, variables: { readonly authScope: string }) => void)
    | undefined;
}

const mockMutationConfigs: MockMutationConfig[] = [];

jest.mock("@/utils/monitoring/mobileLaunchTiming", () => ({
  markMobileLaunchStep: (...args: unknown[]) =>
    mockMarkMobileLaunchStep(...args),
  scheduleMobileLaunchFlush: (...args: unknown[]) =>
    mockScheduleMobileLaunchFlush(...args),
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: (config: MockMutationConfig) => {
    mockMutationConfigs.push(config);
    return { mutateAsync: mutateAsyncMock };
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/notifications",
}));

const setTitleMock = jest.fn();

jest.mock("@/components/auth/Auth", () => {
  const React = require("react");
  return {
    AuthContext: React.createContext(mockAuthContextValue),
    useAuth: () => ({
      setTitle: setTitleMock,
      requestAuth: requestAuthMock,
      setToast: setToastMock,
      setActiveProfileProxy: setActiveProfileProxyMock,
    }),
  };
});

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockSeizeConnectContextValue,
}));

const invalidateNotifications = jest.fn();
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => {
  const React = require("react");
  return {
    ReactQueryWrapperContext: React.createContext({ invalidateNotifications }),
  };
});

jest.mock("@/components/brain/notifications/NotificationsWrapper", () => ({
  __esModule: true,
  default: () => <div data-testid="wrapper" />,
}));

jest.mock("@/components/brain/notifications/NotificationsCauseFilter", () => ({
  __esModule: true,
  default: () => <div data-testid="filter" />,
}));

jest.mock("@/components/brain/content/input/BrainContentInput", () => ({
  __esModule: true,
  default: () => <div data-testid="input" />,
}));

jest.mock("@/components/brain/my-stream/layout/MyStreamNoItems", () => ({
  __esModule: true,
  default: () => <div data-testid="no-items" />,
}));

const useNotificationsQueryMock = jest.fn();
jest.mock("@/hooks/useNotificationsQuery", () => ({
  useNotificationsQuery: () => useNotificationsQueryMock(),
}));

jest.mock("@/components/notifications/NotificationsContext", () => ({
  useNotificationsContext: () => ({
    removeAllDeliveredNotifications: jest.fn(),
  }),
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ notificationsViewStyle: { height: "10px" } }),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    hasTouchScreen: false,
    isApp: false,
    isAppleMobile: false,
    isMobileDevice: false,
  })),
}));

// Mock TitleContext
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import Notifications from "@/components/brain/notifications";
import { floatingDockClearanceClassName } from "@/components/brain/notifications/notifications.constants";
import useDeviceInfo from "@/hooks/useDeviceInfo";

const useDeviceInfoMock = useDeviceInfo as jest.MockedFunction<
  typeof useDeviceInfo
>;

const getDefaultDeviceInfo = () => ({
  hasTouchScreen: false,
  isApp: false,
  isAppleMobile: false,
  isMobileDevice: false,
});

const mockSuccessfulNotificationsQuery = () => {
  useNotificationsQueryMock.mockReturnValue({
    items: ["a"],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn().mockResolvedValue(undefined),
    refetch: jest.fn().mockResolvedValue(undefined),
    isInitialQueryDone: true,
    isSuccess: true,
    error: null,
  });
};

describe("Notifications component", () => {
  beforeEach(() => {
    mockMutationConfigs.length = 0;
    mutateAsyncMock.mockClear();
    mutateAsyncMock.mockResolvedValue(undefined);
    useNotificationsQueryMock.mockReset();
    setTitleMock.mockClear();
    requestAuthMock.mockClear();
    requestAuthMock.mockResolvedValue({ success: true });
    setActiveProfileProxyMock.mockClear();
    setActiveProfileProxyMock.mockResolvedValue(undefined);
    setToastMock.mockClear();
    mockMarkMobileLaunchStep.mockClear();
    mockScheduleMobileLaunchFlush.mockClear();
    mockAuthContextValue.connectedProfile = { handle: "bob", id: "1" };
    mockAuthContextValue.isAuthenticated = true;
    mockSeizeConnectContextValue.address =
      "0x00000000000000000000000000000000000000AA";
    mockSeizeConnectContextValue.isSigningOutAll = false;
    useDeviceInfoMock.mockReturnValue(getDefaultDeviceInfo());
  });

  it("shows loader when fetching and no items", async () => {
    useNotificationsQueryMock.mockReturnValue({
      items: [],
      isFetching: true,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn().mockResolvedValue(undefined),
      refetch: jest.fn().mockResolvedValue(undefined),
      isInitialQueryDone: false,
      isSuccess: false,
      error: null,
    });

    render(<Notifications activeDrop={null} setActiveDrop={jest.fn()} />);

    expect(
      screen.getByText("Loading notifications...", { selector: "div" })
    ).toBeInTheDocument();
    expect(mockMarkMobileLaunchStep).not.toHaveBeenCalled();
    expect(mockScheduleMobileLaunchFlush).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled();
    });
    // Title is set via TitleContext hooks
  });

  it("renders wrapper with items", async () => {
    mockSuccessfulNotificationsQuery();

    render(<Notifications activeDrop={null} setActiveDrop={jest.fn()} />);

    expect(screen.getByTestId("wrapper")).toBeInTheDocument();
    expect(mockMarkMobileLaunchStep).toHaveBeenCalledWith(
      "route_first_useful_content"
    );
    expect(mockScheduleMobileLaunchFlush).toHaveBeenCalledWith(
      "notifications_content_visible",
      250
    );
    expect(
      document.querySelector('[data-mobile-bottom-nav-scroll-target="true"]')
    ).not.toHaveClass(floatingDockClearanceClassName);
    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled();
    });
  });

  it("does not add floating dock clearance on mobile web", async () => {
    useDeviceInfoMock.mockReturnValue({
      ...getDefaultDeviceInfo(),
      hasTouchScreen: true,
      isMobileDevice: true,
    });
    mockSuccessfulNotificationsQuery();

    render(<Notifications activeDrop={null} setActiveDrop={jest.fn()} />);

    expect(
      document.querySelector('[data-mobile-bottom-nav-scroll-target="true"]')
    ).not.toHaveClass(floatingDockClearanceClassName);
    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled();
    });
  });

  it("keeps floating dock clearance in the Capacitor app", async () => {
    useDeviceInfoMock.mockReturnValue({
      ...getDefaultDeviceInfo(),
      hasTouchScreen: true,
      isApp: true,
      isMobileDevice: true,
    });
    mockSuccessfulNotificationsQuery();

    render(<Notifications activeDrop={null} setActiveDrop={jest.fn()} />);

    expect(
      document.querySelector('[data-mobile-bottom-nav-scroll-target="true"]')
    ).toHaveClass(floatingDockClearanceClassName);
    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled();
    });
  });

  it("shows no items component when query done but empty", async () => {
    useNotificationsQueryMock.mockReturnValue({
      items: [],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn().mockResolvedValue(undefined),
      refetch: jest.fn().mockResolvedValue(undefined),
      isInitialQueryDone: true,
      isSuccess: true,
      error: null,
    });

    render(<Notifications activeDrop={null} setActiveDrop={jest.fn()} />);

    expect(screen.getByTestId("no-items")).toBeInTheDocument();
    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled();
    });
  });

  it("does not show a mark-read error after its auth scope signs out", async () => {
    mockSuccessfulNotificationsQuery();
    const { rerender } = render(
      <Notifications activeDrop={null} setActiveDrop={jest.fn()} />
    );

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled();
    });
    const markAllMutation = mockMutationConfigs[0];
    const variables = mutateAsyncMock.mock.calls[0]?.[0] as {
      readonly authScope: string;
    };

    mockAuthContextValue.connectedProfile = null;
    mockAuthContextValue.isAuthenticated = false;
    mockSeizeConnectContextValue.isSigningOutAll = true;
    rerender(<Notifications activeDrop={null} setActiveDrop={jest.fn()} />);

    act(() => {
      markAllMutation?.onError?.("Unauthorized", variables);
    });

    expect(setToastMock).not.toHaveBeenCalled();
  });

  it("shows a mark-read error when its auth scope remains current", async () => {
    mockSuccessfulNotificationsQuery();
    render(<Notifications activeDrop={null} setActiveDrop={jest.fn()} />);

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled();
    });
    const markAllMutation = mockMutationConfigs[0];
    const variables = mutateAsyncMock.mock.calls[0]?.[0] as {
      readonly authScope: string;
    };

    act(() => {
      markAllMutation?.onError?.("Unauthorized", variables);
    });

    expect(setToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Couldn't mark notifications as read.",
      })
    );
  });
});
