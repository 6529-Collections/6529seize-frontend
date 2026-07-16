import { act, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";

import WaveServerFeedSeed, {
  WaveServerFeedSeedGate,
} from "@/components/waves/WaveServerFeedSeed";
import useWaveMessagesStore from "@/contexts/wave/hooks/useWaveMessagesStore";
import type { ServerWaveFeedSeedResult } from "@/contexts/wave/server-wave-feed-seed";
import type { ApiWave } from "@/generated/models/ApiWave";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";

const mockRegisterWave = jest.fn();
const mockRegisterPending = jest.fn();
const mockClearPending = jest.fn();
const mockReplacePending = jest.fn();
const mockExpire = jest.fn();
const mockApply = jest.fn();
const mockCompleteInitialRegistration = jest.fn();
const mockTrackStart = jest.fn();
const mockTrackSuccess = jest.fn();
const mockTrackTerminal = jest.fn();
let mockIsNative = false;
let mockMyStreamValue: {
  registerWave: typeof mockRegisterWave;
  serverFeedSeed: {
    registerPending: (...args: any[]) => unknown;
    clearPending: (...args: any[]) => unknown;
    replacePending: (...args: any[]) => unknown;
    expire: (...args: any[]) => unknown;
    apply: (...args: any[]) => unknown;
    completeInitialRegistration: (...args: any[]) => unknown;
  };
};
let storeBackedSeedApi: ReturnType<typeof useWaveMessagesStore> | null = null;

const useDefaultMockMyStreamValue = () => {
  mockMyStreamValue = {
    registerWave: mockRegisterWave,
    serverFeedSeed: {
      registerPending: mockRegisterPending,
      clearPending: mockClearPending,
      replacePending: mockReplacePending,
      expire: mockExpire,
      apply: mockApply,
      completeInitialRegistration: mockCompleteInitialRegistration,
    },
  };
};

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => mockMyStreamValue,
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: mockIsNative }),
}));

jest.mock("@/contexts/wave/hooks/waveFeedTelemetry", () => ({
  createWaveFeedAbortError: jest.fn(
    () => new DOMException("Aborted", "AbortError")
  ),
  createWaveFeedUnavailableError: jest.fn(() => new Error("unavailable")),
  getWaveFeedTelemetryStartedAtMs: jest.fn(() => 100),
  trackWaveFeedLoadStart: (...args: unknown[]) => mockTrackStart(...args),
  trackWaveFeedLoadSuccess: (...args: unknown[]) => mockTrackSuccess(...args),
  trackWaveFeedLoadTerminalFromError: (...args: unknown[]) =>
    mockTrackTerminal(...args),
}));

jest.mock("@/utils/monitoring/mobileLaunchTiming", () => ({
  markMobileLaunchStep: jest.fn(),
}));

const wave = {
  id: "wave-1",
  name: "Wave 1",
  picture: null,
  description_drop: { id: "description" },
  last_drop_time: 1,
  pinned: false,
  identity_wave: false,
  author: { handle: "author" },
  visibility: { scope: { group: null } },
  participation: {
    authenticated_user_eligible: true,
    scope: { group: null },
    submission_strategy: null,
  },
  chat: {
    authenticated_user_eligible: true,
    links_disabled: false,
    scope: { group: null },
  },
  voting: {
    authenticated_user_eligible: true,
    scope: { group: null },
    period: null,
    credit_type: "TDH",
    forbid_negative_votes: false,
    credit_nfts: [],
    credit_scope: null,
  },
  wave: {
    authenticated_user_eligible_for_admin: false,
    admin_group: { group: null },
    admin_drop_deletion_enabled: false,
  },
} as unknown as ApiWave;

const makeSeedDrops = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `drop-${index + 1}`,
    serial_no: index + 1,
  }));

const renderSeed = (promise: Promise<any>) => {
  return render(
    <WaveServerFeedSeedGate waveId={wave.id}>
      <div data-testid="wave-shell" />
      <WaveServerFeedSeed promise={promise} wave={wave} waveId={wave.id} />
    </WaveServerFeedSeedGate>
  );
};

const StoreBackedSeedHarness = ({
  promise,
}: {
  readonly promise: Promise<ServerWaveFeedSeedResult> | null;
}) => {
  const store = useWaveMessagesStore();
  storeBackedSeedApi = store;
  mockMyStreamValue = {
    registerWave: mockRegisterWave,
    serverFeedSeed: {
      registerPending: store.registerPendingServerFeedSeed,
      clearPending: store.clearPendingServerFeedSeed,
      replacePending: store.replacePendingServerFeedSeed,
      expire: store.expireServerFeedSeed,
      apply: store.applyServerFeedSeed,
      completeInitialRegistration:
        store.completeInitialServerFeedRegistration,
    },
  };
  return (
    <WaveServerFeedSeedGate waveId={wave.id}>
      {promise ? (
        <WaveServerFeedSeed promise={promise} wave={wave} waveId={wave.id} />
      ) : null}
    </WaveServerFeedSeedGate>
  );
};

describe("WaveServerFeedSeed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegisterWave.mockReset();
    mockApply.mockReturnValue(true);
    mockReplacePending.mockReturnValue(true);
    mockIsNative = false;
    storeBackedSeedApi = null;
    useDefaultMockMyStreamValue();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("registers the ancestor gate before descendant client effects", async () => {
    const order: string[] = [];
    mockRegisterPending.mockImplementation(() => {
      order.push("gate");
    });
    const RegistrationProbe = () => {
      useEffect(() => {
        order.push("client");
      }, []);
      return null;
    };

    render(
      <WaveServerFeedSeedGate waveId={wave.id}>
        <RegistrationProbe />
      </WaveServerFeedSeedGate>
    );

    await waitFor(() => expect(order).toEqual(["gate", "client"]));
  });

  it("expires a missing streamed seed and falls back to the client", async () => {
    jest.useFakeTimers();
    render(
      <WaveServerFeedSeedGate waveId={wave.id}>
        <div />
      </WaveServerFeedSeedGate>
    );
    expect(jest.getTimerCount()).toBeGreaterThan(0);

    act(() => {
      jest.advanceTimersByTime(10_000);
    });

    expect(mockExpire).toHaveBeenCalledWith(wave.id, expect.any(Promise));
    expect(mockRegisterWave).toHaveBeenCalledWith(wave.id, true);
    expect(mockTrackTerminal).toHaveBeenCalledWith(
      expect.objectContaining({
        loadSource: "server_initial",
        remainedUnavailable: false,
      })
    );
  });

  it("ignores a streamed seed that resolves after gate expiry", async () => {
    jest.useFakeTimers();
    let resolveSeed: ((value: ServerWaveFeedSeedResult) => void) | undefined;
    const promise = new Promise<ServerWaveFeedSeedResult>((resolve) => {
      resolveSeed = resolve;
    });

    await act(async () => {
      renderSeed(promise);
      await Promise.resolve();
    });
    expect(jest.getTimerCount()).toBeGreaterThan(0);

    act(() => {
      jest.advanceTimersByTime(10_000);
    });

    expect(mockExpire).toHaveBeenCalledWith(wave.id, expect.any(Promise));
    expect(mockRegisterWave).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSeed?.({
        ok: true,
        waveId: wave.id,
        drops: makeSeedDrops(1),
        hasNextPage: false,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockApply).not.toHaveBeenCalled();
    expect(mockRegisterWave).toHaveBeenCalledTimes(1);
  });

  it("releases the placeholder guard when the gated route unmounts", () => {
    const { unmount } = render(
      <WaveServerFeedSeedGate waveId={wave.id}>
        <div />
      </WaveServerFeedSeedGate>
    );
    mockExpire.mockClear();

    unmount();

    expect(mockExpire).toHaveBeenCalledWith(wave.id, expect.any(Promise));
  });

  it("streams independently of the shell while the seed is pending", () => {
    const promise = new Promise<any>(() => {});
    renderSeed(promise);

    expect(screen.getByTestId("wave-shell")).toBeInTheDocument();
    expect(mockRegisterPending).toHaveBeenCalledWith(
      wave.id,
      expect.any(Promise)
    );
    expect(mockReplacePending).not.toHaveBeenCalled();
    expect(mockApply).not.toHaveBeenCalled();
  });

  it("applies the desktop seed from authorized metadata without waiting for query hydration", async () => {
    await act(async () => {
      renderSeed(
        Promise.resolve({
          ok: true,
          waveId: wave.id,
          drops: makeSeedDrops(50),
          hasNextPage: true,
        })
      );
      await Promise.resolve();
    });

    await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(1));
    expect(mockApply).toHaveBeenCalledWith({
      waveId: wave.id,
      drops: expect.arrayContaining([
        expect.objectContaining({
          id: "drop-1",
          wave: expect.objectContaining({ id: wave.id }),
        }),
      ]),
      hasNextPage: true,
      onReady: expect.any(Function),
      promise: expect.any(Promise),
    });
    expect(mockApply.mock.calls[0]?.[0].drops).toHaveLength(50);
    expect(mockRegisterWave).not.toHaveBeenCalled();
  });

  it("preserves the native 20-drop initial cohort while retaining the cursor", async () => {
    mockIsNative = true;
    await act(async () => {
      renderSeed(
        Promise.resolve({
          ok: true,
          waveId: wave.id,
          drops: makeSeedDrops(50),
          hasNextPage: false,
        })
      );
      await Promise.resolve();
    });

    await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(1));
    expect(mockApply.mock.calls[0]?.[0].drops).toHaveLength(20);
    expect(mockApply.mock.calls[0]?.[0].hasNextPage).toBe(true);
    expect(mockRegisterWave).not.toHaveBeenCalled();
  });

  it("falls back to the existing client request when the server seed fails", async () => {
    await act(async () => {
      renderSeed(Promise.resolve({ ok: false, waveId: wave.id }));
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(mockRegisterWave).toHaveBeenCalledWith(wave.id, true)
    );
    expect(mockRegisterWave).toHaveBeenCalledTimes(1);
    expect(mockApply).not.toHaveBeenCalled();
    expect(mockTrackTerminal).toHaveBeenCalledTimes(1);
  });

  it("falls back under current auth when the old-profile seed is invalidated", async () => {
    mockApply.mockReturnValue(false);
    await act(async () => {
      renderSeed(
        Promise.resolve({
          ok: true,
          waveId: wave.id,
          drops: makeSeedDrops(1),
          hasNextPage: false,
        })
      );
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(mockRegisterWave).toHaveBeenCalledWith(wave.id, true)
    );
    expect(mockRegisterWave).toHaveBeenCalledTimes(1);
    expect(mockApply).toHaveBeenCalledTimes(1);
    expect(mockTrackTerminal).toHaveBeenCalledTimes(1);
  });

  it("starts the normal client fetch when the profile changes with a seed pending", async () => {
    const oldProfilePromise = new Promise<any>(() => {});
    renderSeed(oldProfilePromise);

    await act(async () => {
      await Promise.resolve();
      globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT));
    });

    expect(mockExpire).toHaveBeenCalledWith(wave.id, expect.any(Promise));
    await waitFor(() =>
      expect(mockRegisterWave).toHaveBeenCalledWith(wave.id, true)
    );
    expect(mockApply).not.toHaveBeenCalled();
    expect(mockTrackTerminal).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ name: "AbortError" }),
        loadSource: "server_initial",
      })
    );
  });

  it("waits for component and store invalidation before fetching after a pending switch", async () => {
    const oldProfilePromise = new Promise<ServerWaveFeedSeedResult>(() => {});
    const storeOnlyPromise = new Promise<ServerWaveFeedSeedResult>(() => {});
    const addEventListenerSpy = jest.spyOn(globalThis, "addEventListener");
    const { rerender } = render(<StoreBackedSeedHarness promise={null} />);
    await waitFor(() => {
      const profileSwitchListeners = addEventListenerSpy.mock.calls.filter(
        ([eventName]) => eventName === PROFILE_SWITCHED_EVENT
      );
      expect(profileSwitchListeners).toHaveLength(2);
    });
    rerender(<StoreBackedSeedHarness promise={oldProfilePromise} />);
    await waitFor(() =>
      expect(storeBackedSeedApi?.hasServerFeedSeed(wave.id)).toBe(true)
    );
    act(() => {
      storeBackedSeedApi?.registerPendingServerFeedSeed(
        "store-only-wave",
        storeOnlyPromise
      );
    });
    expect(
      storeBackedSeedApi?.hasServerFeedSeed("store-only-wave")
    ).toBe(true);
    await waitFor(() => {
      const profileSwitchListeners = addEventListenerSpy.mock.calls.filter(
        ([eventName]) => eventName === PROFILE_SWITCHED_EVENT
      );
      expect(profileSwitchListeners.length).toBeGreaterThanOrEqual(2);
    });
    mockRegisterWave.mockImplementation((registeredWaveId: string) => {
      expect(registeredWaveId).toBe(wave.id);
      expect(storeBackedSeedApi?.hasServerFeedSeed(wave.id)).toBe(false);
      expect(storeBackedSeedApi?.getData(wave.id)).toBeUndefined();
    });

    await act(async () => {
      globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(storeBackedSeedApi?.hasServerFeedSeed(wave.id)).toBe(false);
      expect(
        storeBackedSeedApi?.hasServerFeedSeed("store-only-wave")
      ).toBe(false);
      expect(mockRegisterWave).toHaveBeenCalledWith(wave.id, true);
    });
    expect(storeBackedSeedApi?.getData(wave.id)).toBeUndefined();
    expect(
      storeBackedSeedApi?.applyServerFeedSeed({
        waveId: wave.id,
        drops: [] as any,
        hasNextPage: false,
        promise: oldProfilePromise,
      })
    ).toBe(false);
    addEventListenerSpy.mockRestore();
  });

  it("registers one fallback when the streamed promise loses its gate", async () => {
    mockReplacePending.mockReturnValue(false);

    await act(async () => {
      renderSeed(
        Promise.resolve({
          ok: true,
          waveId: wave.id,
          drops: makeSeedDrops(1),
          hasNextPage: false,
        })
      );
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(mockRegisterWave).toHaveBeenCalledWith(wave.id, true)
    );
    expect(mockRegisterWave).toHaveBeenCalledTimes(1);
    expect(mockApply).not.toHaveBeenCalled();
  });

  it("clears applied seed data before a current-auth refresh after a profile switch", async () => {
    const seedPromise = Promise.resolve({
      ok: true,
      waveId: wave.id,
      drops: makeSeedDrops(1),
      hasNextPage: false,
    } as ServerWaveFeedSeedResult);

    const { rerender } = render(<StoreBackedSeedHarness promise={null} />);
    await act(async () => {
      await Promise.resolve();
      rerender(<StoreBackedSeedHarness promise={seedPromise} />);
    });
    await waitFor(() =>
      expect(storeBackedSeedApi?.getData(wave.id)?.drops).toHaveLength(1)
    );
    expect(mockRegisterWave).not.toHaveBeenCalled();

    await act(async () => {
      globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(storeBackedSeedApi?.getData(wave.id)).toBeUndefined();
      expect(mockRegisterWave).toHaveBeenCalledWith(wave.id, true)
    });
  });
});
