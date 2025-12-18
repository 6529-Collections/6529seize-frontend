import {
  NotificationsProvider,
  useNotificationsContext,
} from "@/components/notifications/NotificationsContext";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";

const push = jest.fn();
const mockUseRouter = jest.fn(() => ({ push }));

let mockIsActive = true;
jest.mock("@/hooks/useCapacitor", () => () => ({
  isCapacitor: true,
  isIos: true,
  get isActive() {
    return mockIsActive;
  },
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
jest.mock("@/components/notifications/stable-device-id", () => ({
  getStableDeviceId: jest.fn().mockResolvedValue("test-device-id"),
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

describe("NotificationsContext initialization", () => {
  beforeEach(() => {
    mockIsActive = true;
    const { PushNotifications } = require("@capacitor/push-notifications");
    jest.clearAllMocks();
    PushNotifications.removeAllListeners.mockClear();
    PushNotifications.addListener.mockClear();
    PushNotifications.register.mockClear();
  });

  it("does not initialize when isActive is false", async () => {
    mockIsActive = false;
    const { PushNotifications } = require("@capacitor/push-notifications");

    renderHook(() => useNotificationsContext(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(PushNotifications.removeAllListeners).not.toHaveBeenCalled();
    expect(PushNotifications.addListener).not.toHaveBeenCalled();
    expect(PushNotifications.register).not.toHaveBeenCalled();
  });

  it("initializes when isActive is true", async () => {
    mockIsActive = true;
    const { PushNotifications } = require("@capacitor/push-notifications");
    renderHook(() => useNotificationsContext(), { wrapper });

    await waitFor(() => {
      expect(PushNotifications.removeAllListeners).toHaveBeenCalled();
    });

    expect(PushNotifications.addListener).toHaveBeenCalled();
    expect(PushNotifications.requestPermissions).toHaveBeenCalled();

    await waitFor(
      () => {
        expect(PushNotifications.register).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });
});

it("removes notifications when functions called", async () => {
  const { PushNotifications } = require("@capacitor/push-notifications");

  let registrationCallback: ((token: { value: string }) => Promise<void>) | null =
    null;
  PushNotifications.addListener.mockImplementation(
    (event: string, callback: (arg: unknown) => Promise<void>) => {
      if (event === "registration") {
        registrationCallback = callback as (token: {
          value: string;
        }) => Promise<void>;
      }
      return Promise.resolve();
    }
  );

  const { result } = renderHook(() => useNotificationsContext(), { wrapper });

  await waitFor(() => {
    expect(PushNotifications.removeAllListeners).toHaveBeenCalled();
  });

  await waitFor(() => {
    expect(registrationCallback).not.toBeNull();
  });

  await act(async () => {
    if (registrationCallback) {
      await registrationCallback({ value: "test-token" });
    }
  });

  await act(async () => {
    await result.current.removeWaveDeliveredNotifications("w1");
    await result.current.removeAllDeliveredNotifications();
  });
  expect(PushNotifications.getDeliveredNotifications).toHaveBeenCalled();
  expect(PushNotifications.removeDeliveredNotifications).toHaveBeenCalled();
  expect(PushNotifications.removeAllDeliveredNotifications).toHaveBeenCalled();
});

it("skips notification removal when not registered", async () => {
  const { PushNotifications } = require("@capacitor/push-notifications");

  PushNotifications.addListener.mockImplementation(() => Promise.resolve());
  PushNotifications.getDeliveredNotifications.mockClear();
  PushNotifications.removeAllDeliveredNotifications.mockClear();

  const { result } = renderHook(() => useNotificationsContext(), { wrapper });

  await waitFor(() => {
    expect(PushNotifications.removeAllListeners).toHaveBeenCalled();
  });

  await act(async () => {
    await result.current.removeWaveDeliveredNotifications("w1");
    await result.current.removeAllDeliveredNotifications();
  });

  expect(PushNotifications.getDeliveredNotifications).not.toHaveBeenCalled();
  expect(PushNotifications.removeAllDeliveredNotifications).not.toHaveBeenCalled();
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

    let registrationCallback: ((token: { value: string }) => Promise<void>) | null =
      null;
    let actionPerformedCallback:
      | ((action: { notification: { data: unknown } }) => Promise<void>)
      | null = null;

    PushNotifications.addListener.mockImplementation(
      (event: string, callback: (arg: unknown) => Promise<void>) => {
        if (event === "registration") {
          registrationCallback = callback as (token: {
            value: string;
          }) => Promise<void>;
        }
        if (event === "pushNotificationActionPerformed") {
          actionPerformedCallback = callback as (action: {
            notification: { data: unknown };
          }) => Promise<void>;
        }
        return Promise.resolve();
      }
    );

    renderHook(() => useNotificationsContext(), { wrapper });

    await waitFor(() => {
      expect(PushNotifications.addListener).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(registrationCallback).not.toBeNull();
      expect(actionPerformedCallback).not.toBeNull();
    });

    await act(async () => {
      if (registrationCallback) {
        await registrationCallback({ value: "test-token" });
      }
    });

    await act(async () => {
      if (actionPerformedCallback) {
        await actionPerformedCallback({
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
