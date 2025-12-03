import {
  NotificationsProvider,
  useNotificationsContext,
} from "@/components/notifications/NotificationsContext";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";

const push = jest.fn();
const mockUseRouter = jest.fn(() => ({ push }));

jest.mock("@/hooks/useCapacitor", () => () => ({
  isCapacitor: true,
  isIos: true,
}));
jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => mockUseRouter(),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: { id: "test-profile-id" } }),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn().mockResolvedValue({}),
  commonApiPostWithoutBodyAndResponse: jest.fn().mockResolvedValue({}),
}));

jest.mock("@capacitor/push-notifications", () => {
  return {
    PushNotifications: {
      removeAllListeners: jest.fn().mockResolvedValue(undefined),
      addListener: jest.fn(),
      requestPermissions: jest.fn().mockResolvedValue({ receive: "granted" }),
      register: jest.fn().mockResolvedValue(undefined),
      getDeliveredNotifications: jest
        .fn()
        .mockResolvedValue({ notifications: [{ data: { wave_id: "w1" } }] }),
      removeDeliveredNotifications: jest.fn().mockResolvedValue(undefined),
      removeAllDeliveredNotifications: jest.fn().mockResolvedValue(undefined),
    },
    PushNotificationSchema: {},
  };
});
jest.mock("@capacitor/device", () => ({
  Device: { getInfo: jest.fn().mockResolvedValue({ platform: "ios" }) },
}));

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NotificationsProvider>{children}</NotificationsProvider>
);

describe("NotificationsContext", () => {
  it("provides context functions", () => {
    const { result } = renderHook(() => useNotificationsContext(), { wrapper });
    expect(typeof result.current.removeAllDeliveredNotifications).toBe(
      "function"
    );
  });

  it("throws when used outside provider", () => {
    const { result } = renderHook(() => {
      try {
        return useNotificationsContext();
      } catch (e) {
        return e;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
  });
});

it("removes notifications when functions called", async () => {
  const { PushNotifications } = require("@capacitor/push-notifications");
  const { result } = renderHook(() => useNotificationsContext(), { wrapper });

  await waitFor(() => {
    expect(PushNotifications.removeAllListeners).toHaveBeenCalled();
  });

  await act(async () => {
    await result.current.removeWaveDeliveredNotifications("w1");
    await result.current.removeAllDeliveredNotifications();
  });
  expect(PushNotifications.getDeliveredNotifications).toHaveBeenCalled();
  expect(PushNotifications.removeDeliveredNotifications).toHaveBeenCalled();
  expect(PushNotifications.removeAllDeliveredNotifications).toHaveBeenCalled();
});

describe("push notification action handling", () => {
  beforeEach(() => {
    push.mockClear();
    const { PushNotifications } = require("@capacitor/push-notifications");
    PushNotifications.addListener.mockClear();
    PushNotifications.removeDeliveredNotifications.mockClear();
  });

  it("redirects based on notification data", async () => {
    const { PushNotifications } = require("@capacitor/push-notifications");
    const { result } = renderHook(() => useNotificationsContext(), { wrapper });

    await waitFor(() => {
      expect(PushNotifications.addListener).toHaveBeenCalled();
    });

    const addListenerCalls = PushNotifications.addListener.mock.calls;
    const actionPerformedCall = addListenerCalls.find(
      (call: any[]) => call[0] === "pushNotificationActionPerformed"
    );
    const callback = actionPerformedCall?.[1];

    expect(callback).toBeDefined();

    await act(async () => {
      if (callback) {
        await callback({
          notification: {
            data: {
              redirect: "profile",
              handle: "abc",
              notification_id: "1",
            },
          },
        });
      }
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/abc");
    });

    expect(PushNotifications.removeDeliveredNotifications).toHaveBeenCalled();
  });
});
