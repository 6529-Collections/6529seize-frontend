import React from "react";
import { renderHook, act } from "@testing-library/react";
import {
  NotificationsProvider,
  useNotificationsContext,
} from "@/components/notifications/NotificationsContext";

jest.mock("@/hooks/useCapacitor", () => () => ({
  isCapacitor: true,
  isIos: true,
}));
jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: { id: "test-profile-id" } }),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiPostWithoutBodyAndResponse: jest.fn().mockResolvedValue({}),
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

jest.mock("@capacitor/push-notifications", () => ({
  PushNotifications: {
    removeAllListeners: jest.fn(),
    addListener: jest.fn(),
    requestPermissions: jest.fn().mockResolvedValue({ receive: "granted" }),
    register: jest.fn(),
    getDeliveredNotifications: jest
      .fn()
      .mockResolvedValue({ notifications: [{ data: { wave_id: "w1" } }] }),
    removeDeliveredNotifications: jest.fn(),
    removeAllDeliveredNotifications: jest.fn(),
  },
}));

jest.mock("@capacitor/device", () => ({
  Device: { getInfo: jest.fn().mockResolvedValue({ platform: "ios" }) },
}));

it("removes notifications when functions called", async () => {
  const { result } = renderHook(() => useNotificationsContext(), { wrapper });
  await act(async () => {
    await result.current.removeWaveDeliveredNotifications("w1");
    await result.current.removeAllDeliveredNotifications();
  });
  const { PushNotifications } = require("@capacitor/push-notifications");
  expect(PushNotifications.getDeliveredNotifications).toHaveBeenCalled();
  expect(PushNotifications.removeDeliveredNotifications).toHaveBeenCalled();
  expect(PushNotifications.removeAllDeliveredNotifications).toHaveBeenCalled();
});

describe("push notification action handling", () => {
  it("redirects based on notification data", async () => {
    const push = jest.fn();
    const useRouterMock = require("next/navigation").useRouter as jest.Mock;
    useRouterMock.mockReturnValue({ push });

    let actionCallback: ((action: any) => Promise<void>) | null = null;
    const { PushNotifications } = require("@capacitor/push-notifications");

    PushNotifications.addListener.mockImplementation((evt: string, cb: any) => {
      if (evt === "pushNotificationActionPerformed") {
        actionCallback = cb;
      }
      return Promise.resolve();
    });

    renderHook(() => useNotificationsContext(), { wrapper });

    // Wait for initialization to complete (includes 500ms iOS delay)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 700));
    });

    expect(actionCallback).not.toBeNull();

    // Manually trigger the action callback
    await act(async () => {
      if (actionCallback) {
        await actionCallback({
          notification: {
            data: {
              redirect: "profile",
              handle: "abc",
            },
          },
        });
      }
    });

    expect(push).toHaveBeenCalledWith("/abc");
    expect(PushNotifications.removeDeliveredNotifications).toHaveBeenCalled();
  });
});
