import {
  NotificationsProvider,
  useNotificationsContext,
} from "@/components/notifications/NotificationsContext";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";

const push = jest.fn();
const mockUseRouter = jest.fn(() => ({ push }));
const mockSeizeSwitchConnectedAccount = jest.fn();
let mockConnectedProfile: { id: string | null; handle: string | null } | null =
  { id: "test-profile-id", handle: "owner" };
const mockSeizeConnectContext = {
  address: "0xaaa",
  connectedAccounts: [
    {
      address: "0xaaa",
      role: null,
      profileId: "test-profile-id",
      profileHandle: "owner",
    },
  ],
  seizeSwitchConnectedAccount: mockSeizeSwitchConnectedAccount,
};

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
  useAuth: () => ({ connectedProfile: mockConnectedProfile }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockSeizeConnectContext,
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn().mockResolvedValue({}),
  commonApiPostWithoutBodyAndResponse: jest.fn().mockResolvedValue({}),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  AUTH_TOKEN_CHANGED_EVENT: "6529-auth-token-changed",
  getAuthJwt: jest.fn(() => "test-jwt"),
  isAuthJwtUsable: jest.fn(
    (jwt: string | null | undefined) =>
      typeof jwt === "string" && jwt.length > 0
  ),
}));
jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
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

const flushMicrotasks = async () => {
  await Promise.resolve();
};

beforeEach(() => {
  const { getAuthJwt, isAuthJwtUsable } = require("@/services/auth/auth.utils");

  getAuthJwt.mockReset();
  getAuthJwt.mockReturnValue("test-jwt");
  isAuthJwtUsable.mockReset();
  isAuthJwtUsable.mockImplementation(
    (jwt: string | null | undefined) =>
      typeof jwt === "string" && jwt.length > 0
  );
});

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
    const {
      getStableDeviceId,
    } = require("@/components/notifications/stable-device-id");
    const sentry = require("@sentry/nextjs");
    jest.clearAllMocks();
    mockSeizeConnectContext.address = "0xaaa";
    mockConnectedProfile = { id: "test-profile-id", handle: "owner" };
    mockSeizeConnectContext.connectedAccounts = [
      {
        address: "0xaaa",
        role: null,
        profileId: "test-profile-id",
        profileHandle: "owner",
      },
    ];
    PushNotifications.removeAllListeners.mockClear();
    PushNotifications.addListener.mockClear();
    PushNotifications.requestPermissions.mockReset();
    PushNotifications.requestPermissions.mockResolvedValue({
      receive: "granted",
    });
    PushNotifications.register.mockClear();
    getStableDeviceId.mockReset();
    getStableDeviceId.mockResolvedValue("test-device-id");
    sentry.captureException.mockClear();
    sentry.addBreadcrumb.mockClear();
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

  it("captures unrecoverable initialization errors", async () => {
    const { PushNotifications } = require("@capacitor/push-notifications");
    const {
      getStableDeviceId,
    } = require("@/components/notifications/stable-device-id");
    const sentry = require("@sentry/nextjs");
    const fatalError = new Error("fatal secure storage error");

    getStableDeviceId.mockRejectedValueOnce(fatalError);

    renderHook(() => useNotificationsContext(), { wrapper });

    await waitFor(() => {
      expect(PushNotifications.removeAllListeners).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(sentry.captureException).toHaveBeenCalledWith(
        fatalError,
        expect.objectContaining({
          tags: expect.objectContaining({
            component: "NotificationsProvider",
            operation: "initializeNotifications",
          }),
        })
      );
    });

    expect(PushNotifications.register).not.toHaveBeenCalled();
  });

  it("records a denied permission response after retrying the exact iOS helper error", async () => {
    const { PushNotifications } = require("@capacitor/push-notifications");
    const sentry = require("@sentry/nextjs");
    const helperApplicationError = new Error(
      "Couldn’t communicate with a helper application."
    );

    PushNotifications.requestPermissions
      .mockRejectedValueOnce(helperApplicationError)
      .mockResolvedValueOnce({ receive: "denied" });

    renderHook(() => useNotificationsContext(), { wrapper });

    await waitFor(() => {
      expect(sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "notifications",
        level: "warning",
        message:
          "Push permission request completed after native error retry.",
        data: {
          component: "NotificationsProvider",
          operation: "requestPermissions",
          retryable: true,
          retry_succeeded: true,
          permission_status: "denied",
          error_name: "Error",
          error_message: "Couldn’t communicate with a helper application.",
        },
      });
    });

    expect(PushNotifications.requestPermissions).toHaveBeenCalledTimes(2);
    expect(sentry.addBreadcrumb).toHaveBeenCalledTimes(1);
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(PushNotifications.register).not.toHaveBeenCalled();
  });

  it("continues registration when the exact iOS helper error retry grants permission", async () => {
    const { PushNotifications } = require("@capacitor/push-notifications");
    const sentry = require("@sentry/nextjs");
    const helperApplicationError = new Error(
      "Couldn’t communicate with a helper application."
    );

    PushNotifications.requestPermissions
      .mockRejectedValueOnce(helperApplicationError)
      .mockResolvedValueOnce({ receive: "granted" });

    renderHook(() => useNotificationsContext(), { wrapper });

    await waitFor(
      () => {
        expect(PushNotifications.register).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 }
    );

    expect(PushNotifications.requestPermissions).toHaveBeenCalledTimes(2);
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Push permission request completed after native error retry.",
        data: expect.objectContaining({
          retry_succeeded: true,
          permission_status: "granted",
        }),
      })
    );
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it("captures a persistent iOS push permission helper error", async () => {
    const { PushNotifications } = require("@capacitor/push-notifications");
    const sentry = require("@sentry/nextjs");
    const initialError = new Error(
      "Couldn’t communicate with a helper application."
    );
    const retryError = new Error(
      "Couldn’t communicate with a helper application."
    );

    PushNotifications.requestPermissions
      .mockRejectedValueOnce(initialError)
      .mockRejectedValue(retryError);

    renderHook(() => useNotificationsContext(), { wrapper });

    await waitFor(() => {
      expect(sentry.captureException).toHaveBeenCalledWith(
        retryError,
        expect.objectContaining({
          tags: {
            component: "NotificationsProvider",
            operation: "initializeNotifications",
          },
        })
      );
    });

    expect(PushNotifications.requestPermissions).toHaveBeenCalledTimes(2);
    expect(sentry.addBreadcrumb).not.toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Push permission request completed after native error retry.",
      })
    );
  });

  it("captures the helper-application error from another initialization step", async () => {
    const { PushNotifications } = require("@capacitor/push-notifications");
    const {
      getStableDeviceId,
    } = require("@/components/notifications/stable-device-id");
    const sentry = require("@sentry/nextjs");
    const secureStorageError = new Error(
      "Couldn’t communicate with a helper application."
    );

    getStableDeviceId.mockRejectedValue(secureStorageError);

    renderHook(() => useNotificationsContext(), { wrapper });

    await waitFor(() => {
      expect(sentry.captureException).toHaveBeenCalledWith(
        secureStorageError,
        expect.objectContaining({
          tags: {
            component: "NotificationsProvider",
            operation: "initializeNotifications",
          },
        })
      );
    });

    expect(PushNotifications.requestPermissions).not.toHaveBeenCalled();
    expect(sentry.addBreadcrumb).not.toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Push permission request completed after native error retry.",
      })
    );
  });

  it.each([
    "Couldn't communicate with a helper application.",
    "Couldn’t communicate with a helper application. Retry later.",
  ])("captures push permission helper-error near-miss %s", async (errorMessage) => {
    const { PushNotifications } = require("@capacitor/push-notifications");
    const sentry = require("@sentry/nextjs");
    const nearMiss = new Error(errorMessage);

    PushNotifications.requestPermissions.mockRejectedValueOnce(nearMiss);

    renderHook(() => useNotificationsContext(), { wrapper });

    await waitFor(() => {
      expect(sentry.captureException).toHaveBeenCalledWith(
        nearMiss,
        expect.objectContaining({
          tags: {
            component: "NotificationsProvider",
            operation: "initializeNotifications",
          },
          extra: expect.objectContaining({
            error_name: "Error",
            error_message: errorMessage,
          }),
        })
      );
    });

    expect(sentry.addBreadcrumb).not.toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Push permission request completed after native error retry.",
      })
    );
    expect(PushNotifications.requestPermissions).toHaveBeenCalledTimes(1);
  });
});

describe("push registration behavior", () => {
  const setupRegistrationCallback = async () => {
    const { PushNotifications } = require("@capacitor/push-notifications");

    let registrationCallback:
      | ((token: { value: string }) => Promise<void>)
      | null = null;
    let registrationErrorCallback: ((error: unknown) => void) | null = null;

    PushNotifications.addListener.mockImplementation(
      (event: string, callback: (arg: unknown) => void | Promise<void>) => {
        if (event === "registration") {
          registrationCallback = callback as (token: {
            value: string;
          }) => Promise<void>;
        }
        if (event === "registrationError") {
          registrationErrorCallback = callback as (error: unknown) => void;
        }
        return Promise.resolve();
      }
    );

    const renderedHook = renderHook(() => useNotificationsContext(), {
      wrapper,
    });

    await waitFor(() => {
      expect(PushNotifications.addListener).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(registrationCallback).not.toBeNull();
    });
    await waitFor(() => {
      expect(registrationErrorCallback).not.toBeNull();
    });

    return {
      registrationCallback: registrationCallback as (token: {
        value: string;
      }) => Promise<void>,
      getRegistrationCallback: () => {
        if (!registrationCallback) {
          throw new Error("registration callback was not registered");
        }
        return registrationCallback;
      },
      rerender: renderedHook.rerender,
      registrationErrorCallback: registrationErrorCallback as (
        error: unknown
      ) => void,
    };
  };

  beforeEach(() => {
    const { PushNotifications } = require("@capacitor/push-notifications");
    const { commonApiPost } = require("@/services/api/common-api");
    const {
      getAuthJwt,
      isAuthJwtUsable,
    } = require("@/services/auth/auth.utils");
    const sentry = require("@sentry/nextjs");

    jest.clearAllMocks();
    PushNotifications.addListener.mockClear();
    mockConnectedProfile = { id: "test-profile-id", handle: "owner" };
    commonApiPost.mockReset();
    commonApiPost.mockResolvedValue({});
    getAuthJwt.mockReturnValue("test-jwt");
    isAuthJwtUsable.mockImplementation(
      (jwt: string | null | undefined) =>
        typeof jwt === "string" && jwt.length > 0
    );
    sentry.captureException.mockClear();
    sentry.addBreadcrumb.mockClear();
  });

  it("skips registration when auth token is unavailable", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const {
      getAuthJwt,
      isAuthJwtUsable,
    } = require("@/services/auth/auth.utils");
    const sentry = require("@sentry/nextjs");

    getAuthJwt.mockReturnValue(null);
    isAuthJwtUsable.mockReturnValue(false);

    const { registrationCallback } = await setupRegistrationCallback();

    await act(async () => {
      await registrationCallback({ value: "test-token" });
    });

    expect(commonApiPost).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Push registration skipped (auth token unavailable).",
        data: expect.objectContaining({
          component: "NotificationsProvider",
          operation: "registerPushNotification",
          profile_id: "test-profile-id",
          platform: "ios",
        }),
      })
    );
  });

  it.each([null, "   "])(
    "skips registration when profile id is unavailable (%p)",
    async (profileId) => {
      const { commonApiPost } = require("@/services/api/common-api");
      const sentry = require("@sentry/nextjs");

      mockConnectedProfile = { id: profileId, handle: "owner" };

      const { registrationCallback } = await setupRegistrationCallback();

      await act(async () => {
        await registrationCallback({ value: "test-token" });
      });

      expect(commonApiPost).not.toHaveBeenCalled();
      expect(sentry.captureException).not.toHaveBeenCalled();
      expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "warning",
          message: "Push registration skipped (profile id unavailable).",
          data: expect.objectContaining({
            component: "NotificationsProvider",
            operation: "registerPushNotification",
            platform: "ios",
          }),
        })
      );
    }
  );

  it("reinitializes registration when auth becomes usable", async () => {
    const { PushNotifications } = require("@capacitor/push-notifications");
    const { commonApiPost } = require("@/services/api/common-api");
    const {
      getAuthJwt,
      isAuthJwtUsable,
    } = require("@/services/auth/auth.utils");

    getAuthJwt.mockReturnValue(null);
    isAuthJwtUsable.mockReturnValue(false);

    const { registrationCallback, getRegistrationCallback } =
      await setupRegistrationCallback();

    await act(async () => {
      await registrationCallback({ value: "test-token" });
    });

    expect(commonApiPost).not.toHaveBeenCalled();

    getAuthJwt.mockReturnValue("fresh-test-jwt");
    isAuthJwtUsable.mockReturnValue(true);

    await act(async () => {
      globalThis.dispatchEvent(new Event("6529-auth-token-changed"));
    });

    await waitFor(() => {
      expect(PushNotifications.removeAllListeners).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      await getRegistrationCallback()({ value: "test-token" });
    });

    expect(commonApiPost).toHaveBeenCalledTimes(1);
  });

  it("treats unauthorized push registration as stale auth state", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const sentry = require("@sentry/nextjs");
    const unauthorizedError = Object.assign(new Error("Unauthorized"), {
      status: 401,
      response: {
        status: 401,
      },
    });

    commonApiPost.mockRejectedValue(unauthorizedError);
    const { registrationCallback } = await setupRegistrationCallback();

    await act(async () => {
      await registrationCallback({ value: "test-token" });
    });

    expect(commonApiPost).toHaveBeenCalledTimes(1);
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Push registration skipped (stale auth).",
        data: expect.objectContaining({
          component: "NotificationsProvider",
          operation: "registerPushNotification",
          status_code: 401,
          profile_id: "test-profile-id",
          platform: "ios",
        }),
      })
    );
  });

  it("retries on rate limit and does not capture exception", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const sentry = require("@sentry/nextjs");
    const rateLimitError = new Error("Rate limit exceeded. Try again in 1 sec");

    commonApiPost.mockRejectedValue(rateLimitError);
    const { registrationCallback } = await setupRegistrationCallback();

    const setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(((
      handler: TimerHandler
    ) => {
      if (typeof handler === "function") {
        handler();
      }
      return 0 as unknown as NodeJS.Timeout;
    }) as typeof global.setTimeout);

    try {
      await act(async () => {
        await registrationCallback({ value: "test-token" });
      });
    } finally {
      setTimeoutSpy.mockRestore();
    }

    expect(commonApiPost).toHaveBeenCalledTimes(3);
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Push registration rate limited.",
      })
    );
  });

  it("parses milliseconds retry hints as milliseconds", async () => {
    const { PushNotifications } = require("@capacitor/push-notifications");
    const { commonApiPost } = require("@/services/api/common-api");
    const sentry = require("@sentry/nextjs");
    const rateLimitError = new Error(
      "Rate limit exceeded. Try again in 500 milliseconds"
    );

    PushNotifications.requestPermissions.mockResolvedValueOnce({
      receive: "denied",
    });
    commonApiPost
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce({});

    const { registrationCallback } = await setupRegistrationCallback();

    await act(async () => {
      await registrationCallback({ value: "test-token" });
    });

    await waitFor(() => {
      expect(commonApiPost).toHaveBeenCalledTimes(2);
    });
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Push registration attempt failed. Retrying.",
        data: expect.objectContaining({
          delay_ms: 500,
          rate_limited: true,
        }),
      })
    );
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it("uses retry-after header metadata from structured API errors", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const sentry = require("@sentry/nextjs");
    const rateLimitHeaders = new Headers({ "Retry-After": "2" });
    const rateLimitError = Object.assign(new Error("Too Many Requests"), {
      status: 429,
      headers: rateLimitHeaders,
      response: {
        status: 429,
        headers: rateLimitHeaders,
      },
    });

    commonApiPost
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce({});

    const { registrationCallback } = await setupRegistrationCallback();

    await act(async () => {
      await registrationCallback({ value: "test-token" });
    });

    await waitFor(
      () => {
        expect(commonApiPost).toHaveBeenCalledTimes(2);
      },
      { timeout: 3000 }
    );
    expect(commonApiPost).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ errorMode: "structured" })
    );
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Push registration attempt failed. Retrying.",
        data: expect.objectContaining({
          delay_ms: 2000,
          status_code: 429,
          rate_limited: true,
        }),
      })
    );
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it("retries object-shaped network-lost token registration errors without capture", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const sentry = require("@sentry/nextjs");
    const networkLostError = { error: "The network connection was lost." };

    commonApiPost
      .mockRejectedValueOnce(networkLostError)
      .mockResolvedValueOnce({});
    const { registrationCallback } = await setupRegistrationCallback();

    const setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(((
      handler: TimerHandler
    ) => {
      if (typeof handler === "function") {
        handler();
      }
      return 0 as unknown as NodeJS.Timeout;
    }) as typeof global.setTimeout);

    try {
      await act(async () => {
        await registrationCallback({ value: "test-token" });
      });
    } finally {
      setTimeoutSpy.mockRestore();
    }

    expect(commonApiPost).toHaveBeenCalledTimes(2);
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Push registration attempt failed. Retrying.",
        data: expect.objectContaining({
          error_message: "The network connection was lost.",
          rate_limited: false,
        }),
      })
    );
  });

  it("bounds retries for a persistent observed timeout and captures the final failure", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const sentry = require("@sentry/nextjs");
    const timeoutError = new Error("The request timed out.");

    commonApiPost.mockRejectedValue(timeoutError);
    const { registrationCallback } = await setupRegistrationCallback();

    const setTimeoutSpy = jest
      .spyOn(globalThis, "setTimeout")
      .mockImplementation(((handler: TimerHandler) => {
        if (typeof handler === "function") {
          handler();
        }
        return 0 as unknown as NodeJS.Timeout;
      }) as typeof globalThis.setTimeout);

    try {
      await act(async () => {
        await registrationCallback({ value: "test-token" });
      });
    } finally {
      setTimeoutSpy.mockRestore();
    }

    expect(commonApiPost).toHaveBeenCalledTimes(3);
    expect(sentry.addBreadcrumb).toHaveBeenCalledTimes(2);
    expect(sentry.addBreadcrumb).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        message: "Push registration attempt failed. Retrying.",
        data: expect.objectContaining({
          attempt: 1,
          max_attempts: 3,
          error_message: "The request timed out.",
        }),
      })
    );
    expect(sentry.addBreadcrumb).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        message: "Push registration attempt failed. Retrying.",
        data: expect.objectContaining({
          attempt: 2,
          max_attempts: 3,
          error_message: "The request timed out.",
        }),
      })
    );
    expect(sentry.captureException).toHaveBeenCalledWith(
      timeoutError,
      expect.objectContaining({
        tags: expect.objectContaining({
          component: "NotificationsProvider",
          operation: "registerPushNotification",
        }),
        extra: expect.objectContaining({
          attempt: 3,
          max_attempts: 3,
          error_message: "The request timed out.",
        }),
      })
    );
  });

  it("skips duplicate registration for identical fingerprint", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const sentry = require("@sentry/nextjs");
    const { registrationCallback } = await setupRegistrationCallback();

    await act(async () => {
      await registrationCallback({ value: "test-token" });
    });

    await waitFor(() => {
      expect(commonApiPost).toHaveBeenCalledTimes(1);
    });
    await act(flushMicrotasks);

    await act(async () => {
      await registrationCallback({ value: "test-token" });
    });

    expect(commonApiPost).toHaveBeenCalledTimes(1);
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Push registration skipped (already registered in session).",
      })
    );
  });

  it("records transient native registration errors as warning breadcrumbs", async () => {
    const sentry = require("@sentry/nextjs");
    const nativeError = { error: "The network connection was lost." };
    const { registrationErrorCallback } = await setupRegistrationCallback();

    act(() => {
      registrationErrorCallback(nativeError);
    });

    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "warning",
        message: "Push registration transient error.",
        data: expect.objectContaining({
          component: "NotificationsProvider",
          operation: "pushRegistrationError",
          retryable: true,
          error_message: "The network connection was lost.",
        }),
      })
    );
  });

  it.each([
    "The request timed out.",
    "A server with the specified hostname could not be found.",
  ])(
    "records observed transient native registration error %s as a warning breadcrumb",
    async (errorMessage) => {
      const sentry = require("@sentry/nextjs");
      const nativeError = new Error(errorMessage);
      const { registrationErrorCallback } = await setupRegistrationCallback();

      act(() => {
        registrationErrorCallback(nativeError);
      });

      expect(sentry.captureException).not.toHaveBeenCalled();
      expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "warning",
          message: "Push registration transient error.",
          data: expect.objectContaining({
            component: "NotificationsProvider",
            operation: "pushRegistrationError",
            retryable: true,
            error_name: "Error",
            error_message: errorMessage,
          }),
        })
      );
    }
  );

  it.each([
    "Network error: push notification permission denied.",
    "Network request failed: unauthorized.",
    "The request timed out because the device token is invalid.",
    "A server with the specified hostname could not be found because the push configuration is invalid.",
  ])(
    "captures permanent native registration near-miss %s",
    async (errorMessage) => {
      const sentry = require("@sentry/nextjs");
      const nativeError = new Error(errorMessage);
      const { registrationErrorCallback } = await setupRegistrationCallback();

      act(() => {
        registrationErrorCallback(nativeError);
      });

      expect(sentry.addBreadcrumb).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Push registration transient error.",
        })
      );
      expect(sentry.captureException).toHaveBeenCalledWith(
        nativeError,
        expect.objectContaining({
          tags: expect.objectContaining({
            component: "NotificationsProvider",
            operation: "pushRegistrationError",
          }),
          extra: expect.objectContaining({
            retryable: false,
            error_name: "Error",
            error_message: errorMessage,
          }),
        })
      );
    }
  );

  it.each(["-25291", "-25299"])(
    "records known low-value native registration error %s as an info breadcrumb",
    async (errorCode) => {
      const sentry = require("@sentry/nextjs");
      const errorMessage = `The operation couldn't be completed. (com.google.iid error ${errorCode}.)`;
      const nativeError = new Error(errorMessage);
      const { registrationErrorCallback } = await setupRegistrationCallback();

      act(() => {
        registrationErrorCallback(nativeError);
      });

      expect(sentry.captureException).not.toHaveBeenCalled();
      expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "info",
          message: "Push registration low-value native error.",
          data: expect.objectContaining({
            component: "NotificationsProvider",
            operation: "pushRegistrationError",
            retryable: false,
            known_low_value: true,
            error_message: errorMessage,
          }),
        })
      );
    }
  );

  it.each([-25291, -25299])(
    "records low-value native registration errors by domain and code %i",
    async (code) => {
      const sentry = require("@sentry/nextjs");
      const nativeError = {
        domain: "com.google.iid",
        code,
      };
      const { registrationErrorCallback } = await setupRegistrationCallback();

      act(() => {
        registrationErrorCallback(nativeError);
      });

      expect(sentry.captureException).not.toHaveBeenCalled();
      expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "info",
          message: "Push registration low-value native error.",
          data: expect.objectContaining({
            component: "NotificationsProvider",
            operation: "pushRegistrationError",
            retryable: false,
            known_low_value: true,
            error_code: code,
            error_message: "Unknown notification error",
          }),
        })
      );
    }
  );

  it("captures non-transient native registration objects as Error instances", async () => {
    const sentry = require("@sentry/nextjs");
    const nativeError = {
      code: "APNS_ENTITLEMENT_MISSING",
      error: "Missing APNS entitlement",
    };
    const { registrationErrorCallback } = await setupRegistrationCallback();

    act(() => {
      registrationErrorCallback(nativeError);
    });

    expect(sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: expect.objectContaining({
          component: "NotificationsProvider",
          operation: "pushRegistrationError",
        }),
        extra: expect.objectContaining({
          retryable: false,
          error_code: "APNS_ENTITLEMENT_MISSING",
          error_message: "Missing APNS entitlement",
        }),
      })
    );
    const capturedError = sentry.captureException.mock.calls[0][0] as Error;
    expect(capturedError).toBeInstanceOf(Error);
    expect(capturedError.message).toBe("Missing APNS entitlement");
  });

  it("captures non-rate-limit push registration errors", async () => {
    const { commonApiPost } = require("@/services/api/common-api");
    const sentry = require("@sentry/nextjs");
    const fatalError = new Error("fatal push registration failure");
    commonApiPost.mockRejectedValue(fatalError);

    const { registrationCallback } = await setupRegistrationCallback();

    await act(async () => {
      await registrationCallback({ value: "test-token" });
    });

    expect(commonApiPost).toHaveBeenCalledTimes(1);
    expect(sentry.captureException).toHaveBeenCalledWith(
      fatalError,
      expect.objectContaining({
        tags: expect.objectContaining({
          component: "NotificationsProvider",
          operation: "registerPushNotification",
        }),
      })
    );
  });
});

it("removes notifications when functions called", async () => {
  const { PushNotifications } = require("@capacitor/push-notifications");

  let registrationCallback:
    | ((token: { value: string }) => Promise<void>)
    | null = null;
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
  expect(
    PushNotifications.removeAllDeliveredNotifications
  ).not.toHaveBeenCalled();
});

describe("push notification action handling", () => {
  beforeEach(() => {
    push.mockClear();
    mockSeizeSwitchConnectedAccount.mockReset();
    mockSeizeConnectContext.address = "0xaaa";
    mockConnectedProfile = { id: "test-profile-id", handle: "owner" };
    mockSeizeConnectContext.connectedAccounts = [
      {
        address: "0xaaa",
        role: null,
        profileId: "test-profile-id",
        profileHandle: "owner",
      },
    ];
    const { PushNotifications } = require("@capacitor/push-notifications");
    PushNotifications.addListener.mockClear();
    PushNotifications.removeDeliveredNotifications.mockClear();
  });

  it("redirects based on notification data", async () => {
    const { PushNotifications } = require("@capacitor/push-notifications");

    let registrationCallback:
      | ((token: { value: string }) => Promise<void>)
      | null = null;
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
              target_profile_id: "test-profile-id",
              target_profile_handle: "owner",
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

  it("discards notification when profile is not connected", async () => {
    const { PushNotifications } = require("@capacitor/push-notifications");

    let registrationCallback:
      | ((token: { value: string }) => Promise<void>)
      | null = null;
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
              target_profile_id: "missing-profile-id",
              target_profile_handle: "missing-handle",
            },
          },
        });
      }
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(push).not.toHaveBeenCalled();
    expect(PushNotifications.removeDeliveredNotifications).toHaveBeenCalled();
  });
});
