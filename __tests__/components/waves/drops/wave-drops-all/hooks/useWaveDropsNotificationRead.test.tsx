import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useWaveDropsNotificationRead } from "@/components/waves/drops/wave-drops-all/hooks/useWaveDropsNotificationRead";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { render, waitFor } from "@testing-library/react";
import React from "react";

jest.mock("@/services/api/common-api", () => ({
  commonApiPostWithoutBodyAndResponse: jest.fn().mockResolvedValue(undefined),
}));

function TestComponent({
  enabled,
  unreadCount,
  removeWaveDeliveredNotifications,
  waveId,
}: {
  readonly enabled?: boolean;
  readonly unreadCount?: number;
  readonly removeWaveDeliveredNotifications: (
    waveId: string
  ) => Promise<unknown> | void;
  readonly waveId: string;
}) {
  useWaveDropsNotificationRead({
    waveId,
    enabled,
    unreadCount,
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

  it("marks the wave as read when enabled", async () => {
    render(
      <ReactQueryWrapperContext.Provider
        value={{ invalidateNotifications } as any}
      >
        <TestComponent
          waveId="wave-1"
          unreadCount={2}
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    await waitFor(() => {
      expect(removeWaveDeliveredNotifications).toHaveBeenCalledWith("wave-1");
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledWith({
        endpoint: "notifications/wave/wave-1/read",
      });
      expect(invalidateNotifications).toHaveBeenCalled();
    });
  });

  it("skips read-sync when there are no unread drops", () => {
    render(
      <ReactQueryWrapperContext.Provider
        value={{ invalidateNotifications } as any}
      >
        <TestComponent
          waveId="wave-1"
          unreadCount={0}
          removeWaveDeliveredNotifications={removeWaveDeliveredNotifications}
        />
      </ReactQueryWrapperContext.Provider>
    );

    expect(removeWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
    expect(invalidateNotifications).not.toHaveBeenCalled();
  });
});
