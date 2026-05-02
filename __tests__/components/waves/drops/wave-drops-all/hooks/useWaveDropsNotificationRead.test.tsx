import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useWaveDropsNotificationRead } from "@/components/waves/drops/wave-drops-all/hooks/useWaveDropsNotificationRead";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { act, render, waitFor } from "@testing-library/react";
import React from "react";

jest.mock("@/services/api/common-api", () => ({
  commonApiPostWithoutBodyAndResponse: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ activeProfileProxy: null }),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0xAAA" }),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: () => "test-jwt",
}));

jest.mock("jwt-decode", () => ({
  jwtDecode: (token: string) => {
    if (token !== "test-jwt") {
      throw new Error(`Unexpected JWT decode for ${token}`);
    }

    return { sub: "0xAAA", role: null };
  },
}));

let documentVisibilityState: DocumentVisibilityState = "visible";

const setDocumentVisibilityState = (state: DocumentVisibilityState) => {
  documentVisibilityState = state;
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => documentVisibilityState,
  });
};

const dispatchVisibilityChange = () => {
  document.dispatchEvent(new Event("visibilitychange"));
};

function TestComponent({
  enabled,
  removeWaveDeliveredNotifications,
  waveId,
}: {
  readonly enabled?: boolean;
  readonly removeWaveDeliveredNotifications: (
    waveId: string
  ) => Promise<unknown> | void;
  readonly waveId: string;
}) {
  useWaveDropsNotificationRead({
    waveId,
    enabled,
    removeWaveDeliveredNotifications,
  });

  return null;
}

describe("useWaveDropsNotificationRead", () => {
  const invalidateNotifications = jest.fn();
  const removeWaveDeliveredNotifications = jest
    .fn()
    .mockResolvedValue(undefined);

  beforeEach(() => {
    setDocumentVisibilityState("visible");
    invalidateNotifications.mockClear();
    removeWaveDeliveredNotifications.mockClear();
    (
      commonApiPostWithoutBodyAndResponse as jest.MockedFunction<
        typeof commonApiPostWithoutBodyAndResponse
      >
    ).mockClear();
  });

  it("skips read-sync when disabled", () => {
    render(
      <ReactQueryWrapperContext.Provider
        value={{ invalidateNotifications } as any}
      >
        <TestComponent
          waveId="wave-1"
          enabled={false}
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    expect(removeWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("does not mark the wave as read while hidden", async () => {
    setDocumentVisibilityState("hidden");

    render(
      <ReactQueryWrapperContext.Provider
        value={{ invalidateNotifications } as any}
      >
        <TestComponent
          waveId="wave-1"
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(removeWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });

  it("marks the wave as read after a hidden tab becomes visible", async () => {
    setDocumentVisibilityState("hidden");

    render(
      <ReactQueryWrapperContext.Provider
        value={{ invalidateNotifications } as any}
      >
        <TestComponent
          waveId="wave-1"
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(removeWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();

    await act(async () => {
      setDocumentVisibilityState("visible");
      dispatchVisibilityChange();
    });

    await waitFor(() => {
      expect(removeWaveDeliveredNotifications).toHaveBeenCalledWith("wave-1");
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledWith({
        endpoint: "notifications/wave/wave-1/read",
        headers: { Authorization: "Bearer test-jwt" },
      });
      expect(invalidateNotifications).toHaveBeenCalled();
    });
  });

  it("marks the wave as read when enabled", async () => {
    render(
      <ReactQueryWrapperContext.Provider
        value={{ invalidateNotifications } as any}
      >
        <TestComponent
          waveId="wave-1"
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    await waitFor(() => {
      expect(removeWaveDeliveredNotifications).toHaveBeenCalledWith("wave-1");
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledWith({
        endpoint: "notifications/wave/wave-1/read",
        headers: { Authorization: "Bearer test-jwt" },
      });
      expect(invalidateNotifications).toHaveBeenCalled();
    });
  });

  it("marks the wave as read when there is no unread drop count", async () => {
    render(
      <ReactQueryWrapperContext.Provider
        value={{ invalidateNotifications } as any}
      >
        <TestComponent
          waveId="wave-1"
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    await waitFor(() => {
      expect(removeWaveDeliveredNotifications).toHaveBeenCalledWith("wave-1");
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledWith({
        endpoint: "notifications/wave/wave-1/read",
        headers: { Authorization: "Bearer test-jwt" },
      });
      expect(invalidateNotifications).toHaveBeenCalled();
    });
  });
});
