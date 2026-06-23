import SlowModeChatNotice from "@/components/waves/SlowModeChatNotice";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { act, render, screen } from "@testing-library/react";
import React from "react";

const invalidateQueries = jest.fn(() => Promise.resolve());

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries,
  }),
}));

const makeWave = (chat: Record<string, unknown>): any => ({
  id: "wave-1",
  chat,
});

describe("SlowModeChatNotice", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("shows active slow mode when user can post", () => {
    render(
      <SlowModeChatNotice
        wave={makeWave({ slow_mode_cooldown_ms: 60_000 })}
        isDropMode={false}
      />
    );

    expect(
      screen.getByText("Slow mode: one message every 1m")
    ).toBeInTheDocument();
  });

  it("shows countdown when user is cooling down", () => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000);

    render(
      <SlowModeChatNotice
        wave={makeWave({
          slow_mode_cooldown_ms: 60_000,
          next_drop_allowed: 43_000,
        })}
        isDropMode={false}
      />
    );

    expect(
      screen.getByText("Slow mode: send again in 00:42")
    ).toBeInTheDocument();
  });

  it("does not show during participatory drop mode", () => {
    render(
      <SlowModeChatNotice
        wave={makeWave({
          slow_mode_cooldown_ms: 60_000,
          next_drop_allowed: Date.now() + 30_000,
        })}
        isDropMode={true}
      />
    );

    expect(screen.queryByText(/Slow mode:/u)).not.toBeInTheDocument();
  });

  it("invalidates wave when countdown expires", () => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000);

    render(
      <SlowModeChatNotice
        wave={makeWave({
          slow_mode_cooldown_ms: 60_000,
          next_drop_allowed: 2_000,
        })}
        isDropMode={false}
      />
    );

    act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE, { wave_id: "wave-1" }],
    });
  });
});
