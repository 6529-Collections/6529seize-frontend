import { renderHook, act } from "@testing-library/react";
import { useLatestEditableChatDropTarget } from "@/components/waves/hooks/useLatestEditableChatDropTarget";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import type { WaveMessages } from "@/contexts/wave/hooks/types";
import type { Listener } from "@/contexts/wave/hooks/useWaveMessagesStore";

const mockUseMyStream = jest.fn();
let mockWaveMessagesById: Record<string, WaveMessages | undefined> = {};
let mockListenersByWaveId: Record<string, Set<Listener>> = {};
let mockWaveMessagesStore: {
  readonly getData: jest.Mock<WaveMessages | undefined, [string]>;
  readonly subscribe: jest.Mock<void, [string, Listener]>;
  readonly unsubscribe: jest.Mock<void, [string, Listener]>;
};

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => mockUseMyStream(),
}));

const connectedProfile = {
  id: "profile-1",
  handle: "alice",
};

const createDrop = (overrides: Partial<ExtendedDrop> = {}): ExtendedDrop =>
  ({
    id: "drop-1",
    serial_no: 1,
    type: DropSize.FULL,
    stableKey: "drop-1",
    stableHash: "drop-1",
    drop_type: ApiDropType.Chat,
    wave: { id: "wave-1" },
    author: { id: "profile-1", handle: "alice" },
    created_at: "2024-01-01T00:00:00.000Z",
    rank: null,
    winning_context: undefined,
    title: null,
    parts: [],
    metadata: [],
    ...overrides,
  }) as ExtendedDrop;

const createWaveMessages = (
  drops: readonly ExtendedDrop[],
  waveId = "wave-1"
): WaveMessages => ({
  id: waveId,
  isLoading: false,
  isLoadingNextPage: false,
  hasNextPage: false,
  drops: [...drops],
  latestFetchedSerialNo:
    drops.length > 0 ? Math.max(...drops.map((drop) => drop.serial_no)) : null,
});

const emitWaveMessages = (waveMessages: WaveMessages) => {
  mockWaveMessagesById[waveMessages.id] = waveMessages;
  mockListenersByWaveId[waveMessages.id]?.forEach((listener) => {
    listener(waveMessages);
  });
};

describe("useLatestEditableChatDropTarget", () => {
  beforeEach(() => {
    mockWaveMessagesById = {};
    mockListenersByWaveId = {};
    mockWaveMessagesStore = {
      getData: jest.fn((waveId: string) => mockWaveMessagesById[waveId]),
      subscribe: jest.fn((waveId: string, listener: Listener) => {
        const listeners = mockListenersByWaveId[waveId] ?? new Set<Listener>();
        listeners.add(listener);
        mockListenersByWaveId[waveId] = listeners;
        listener(mockWaveMessagesById[waveId]);
      }),
      unsubscribe: jest.fn((waveId: string, listener: Listener) => {
        mockListenersByWaveId[waveId]?.delete(listener);
      }),
    };
    mockUseMyStream.mockReturnValue({
      waveMessagesStore: mockWaveMessagesStore,
    });
  });

  it("returns the latest own chat drop target from current store data", () => {
    mockWaveMessagesById["wave-1"] = createWaveMessages([
      createDrop({ id: "older-own", serial_no: 10 }),
      createDrop({ id: "newer-own", serial_no: 12 }),
    ]);

    const { result } = renderHook(() =>
      useLatestEditableChatDropTarget({
        waveId: "wave-1",
        connectedProfile,
        isProxyMode: false,
      })
    );

    expect(result.current).toEqual({ id: "newer-own", serialNo: 12 });
  });

  it("does not rerender when another user posts a newer drop", () => {
    const renderSpy = jest.fn();
    const ownDrop = createDrop({ id: "own-drop", serial_no: 10 });
    mockWaveMessagesById["wave-1"] = createWaveMessages([ownDrop]);

    const { result } = renderHook(() => {
      renderSpy();
      return useLatestEditableChatDropTarget({
        waveId: "wave-1",
        connectedProfile,
        isProxyMode: false,
      });
    });
    const renderCountAfterMount = renderSpy.mock.calls.length;

    act(() => {
      emitWaveMessages(
        createWaveMessages([
          ownDrop,
          createDrop({
            id: "other-user-drop",
            serial_no: 20,
            author: {
              id: "profile-2",
              handle: "bob",
            } as ExtendedDrop["author"],
          }),
        ])
      );
    });

    expect(result.current).toEqual({ id: "own-drop", serialNo: 10 });
    expect(renderSpy).toHaveBeenCalledTimes(renderCountAfterMount);
  });

  it("updates when the connected user posts a newer saved chat drop", () => {
    const olderOwnDrop = createDrop({ id: "older-own", serial_no: 10 });
    mockWaveMessagesById["wave-1"] = createWaveMessages([olderOwnDrop]);

    const { result } = renderHook(() =>
      useLatestEditableChatDropTarget({
        waveId: "wave-1",
        connectedProfile,
        isProxyMode: false,
      })
    );

    act(() => {
      emitWaveMessages(
        createWaveMessages([
          olderOwnDrop,
          createDrop({ id: "newer-own", serial_no: 20 }),
        ])
      );
    });

    expect(result.current).toEqual({ id: "newer-own", serialNo: 20 });
  });

  it("moves to the previous own chat drop when the latest target is removed", () => {
    const olderOwnDrop = createDrop({ id: "older-own", serial_no: 10 });
    const latestOwnDrop = createDrop({ id: "latest-own", serial_no: 20 });
    mockWaveMessagesById["wave-1"] = createWaveMessages([
      olderOwnDrop,
      latestOwnDrop,
    ]);

    const { result } = renderHook(() =>
      useLatestEditableChatDropTarget({
        waveId: "wave-1",
        connectedProfile,
        isProxyMode: false,
      })
    );

    expect(result.current).toEqual({ id: "latest-own", serialNo: 20 });

    act(() => {
      emitWaveMessages(createWaveMessages([olderOwnDrop]));
    });

    expect(result.current).toEqual({ id: "older-own", serialNo: 10 });
  });

  it("returns null when the removed target was the only own chat drop", () => {
    const latestOwnDrop = createDrop({ id: "latest-own", serial_no: 20 });
    mockWaveMessagesById["wave-1"] = createWaveMessages([latestOwnDrop]);

    const { result } = renderHook(() =>
      useLatestEditableChatDropTarget({
        waveId: "wave-1",
        connectedProfile,
        isProxyMode: false,
      })
    );

    expect(result.current).toEqual({ id: "latest-own", serialNo: 20 });

    act(() => {
      emitWaveMessages(createWaveMessages([]));
    });

    expect(result.current).toBeNull();
  });

  it("returns null in proxy mode or without a connected profile", () => {
    mockWaveMessagesById["wave-1"] = createWaveMessages([
      createDrop({ id: "own-drop", serial_no: 10 }),
    ]);

    const { result, rerender } = renderHook(
      ({
        isProxyMode,
        profile,
      }: {
        readonly isProxyMode: boolean;
        readonly profile: typeof connectedProfile | null;
      }) =>
        useLatestEditableChatDropTarget({
          waveId: "wave-1",
          connectedProfile: profile,
          isProxyMode,
        }),
      {
        initialProps: {
          isProxyMode: true,
          profile: connectedProfile,
        },
      }
    );

    expect(result.current).toBeNull();

    rerender({ isProxyMode: false, profile: null });

    expect(result.current).toBeNull();
  });

  it("unsubscribes on cleanup", () => {
    mockWaveMessagesById["wave-1"] = createWaveMessages([
      createDrop({ id: "own-drop", serial_no: 10 }),
    ]);

    const { unmount } = renderHook(() =>
      useLatestEditableChatDropTarget({
        waveId: "wave-1",
        connectedProfile,
        isProxyMode: false,
      })
    );
    const listener = mockWaveMessagesStore.subscribe.mock.calls[0]?.[1];

    unmount();

    expect(listener).toBeDefined();
    expect(mockWaveMessagesStore.unsubscribe).toHaveBeenCalledWith(
      "wave-1",
      listener
    );
    expect(mockListenersByWaveId["wave-1"]?.size ?? 0).toBe(0);
  });
});
