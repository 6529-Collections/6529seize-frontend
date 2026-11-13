import { QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { WsMessageType } from "@/helpers/Types";
import { WavesChangedWebSocketSync } from "@/services/websocket/WavesChangedWebSocketSync";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import { createTestQueryClient } from "../../utils/reactQuery";

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: jest.fn(),
}));

let mockConnectedAccounts: { profileId: string | null; isActive: boolean }[] =
  [];
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ connectedAccounts: mockConnectedAccounts }),
}));

const mockedUseWebSocketMessage = useWebSocketMessage as jest.MockedFunction<
  typeof useWebSocketMessage
>;

describe("WavesChangedWebSocketSync", () => {
  let wavesChanged: ((data: unknown) => void) | undefined;

  const setup = () => {
    const queryClient = createTestQueryClient();
    const invalidate = jest
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    queryClient.setQueryData([QueryKey.WAVE, { wave_id: "wave-1" }], {});
    queryClient.setQueryData([QueryKey.WAVE, { wave_id: "wave-3" }], {});
    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <WavesChangedWebSocketSync />
      </QueryClientProvider>
    );
    const invalidatedKeys = () =>
      invalidate.mock.calls.map(([filters]) => filters?.queryKey?.[0]);
    const invalidatedWaves = () => {
      const call = invalidate.mock.calls.find(
        ([filters]) => filters?.queryKey?.[0] === QueryKey.WAVE
      );
      const predicate = call?.[0]?.predicate;
      if (!predicate) return [];
      return queryClient
        .getQueryCache()
        .findAll({ queryKey: [QueryKey.WAVE] })
        .filter((query) => predicate(query))
        .map((query) => (query.queryKey[1] as { wave_id: string }).wave_id);
    };
    return { invalidate, invalidatedKeys, invalidatedWaves, ...rendered };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    wavesChanged = undefined;
    mockConnectedAccounts = [
      { profileId: "active-profile", isActive: true },
      { profileId: "other-account", isActive: false },
    ];
    mockedUseWebSocketMessage.mockImplementation((messageType, callback) => {
      if (messageType === WsMessageType.WAVES_CHANGED) {
        wavesChanged = callback as (data: unknown) => void;
      }
      return { isConnected: true };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("refetches the active profile's wave lists and the changed waves, once per burst", () => {
    const { invalidate, invalidatedKeys, invalidatedWaves } = setup();

    act(() => {
      wavesChanged?.({
        profile_id: "active-profile",
        wave_ids: ["wave-1"],
        reason: "FOLLOWED",
      });
      wavesChanged?.({
        profile_id: "active-profile",
        wave_ids: ["wave-2"],
        reason: "ADDED",
      });
    });
    expect(invalidate).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(invalidatedKeys()).toEqual([
      QueryKey.WAVES_V2,
      QueryKey.WAVES_OVERVIEW,
      QueryKey.WAVE,
    ]);
    // Only cached waves named in the frames refetch.
    expect(invalidatedWaves()).toEqual(["wave-1"]);
  });

  it("treats an unknown reason like any other change", () => {
    const { invalidatedKeys } = setup();

    act(() => {
      wavesChanged?.({
        profile_id: "active-profile",
        wave_ids: [],
        reason: "SOMETHING_NEW",
      });
      jest.advanceTimersByTime(250);
    });

    expect(invalidatedKeys()).toEqual([
      QueryKey.WAVES_V2,
      QueryKey.WAVES_OVERVIEW,
    ]);
  });

  it.each([
    [
      "another connected account",
      { profile_id: "other-account", wave_ids: [] },
    ],
    ["a frame without a profile", { wave_ids: ["wave-1"] }],
    ["a malformed frame", "WAVES_CHANGED"],
  ])("ignores %s", (_label, data) => {
    const { invalidate } = setup();

    act(() => {
      wavesChanged?.(data);
      jest.advanceTimersByTime(250);
    });

    expect(invalidate).not.toHaveBeenCalled();
  });

  it("drops a pending refetch on unmount", () => {
    const { invalidate, unmount } = setup();

    act(() => {
      wavesChanged?.({ profile_id: "active-profile", wave_ids: ["wave-1"] });
    });
    unmount();
    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(invalidate).not.toHaveBeenCalled();
  });
});
