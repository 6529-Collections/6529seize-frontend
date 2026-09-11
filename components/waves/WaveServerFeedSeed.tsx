"use client";

import {
  createContext,
  Suspense,
  type ReactNode,
  use,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { WAVE_DROPS_NATIVE_INITIAL_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import {
  createWaveFeedAbortError,
  createWaveFeedUnavailableError,
  getWaveFeedTelemetryStartedAtMs,
  trackWaveFeedLoadStart,
  trackWaveFeedLoadSuccess,
  trackWaveFeedLoadTerminalFromError,
} from "@/contexts/wave/hooks/waveFeedTelemetry";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ServerWaveFeedSeedResult } from "@/contexts/wave/server-wave-feed-seed";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import { toApiWaveMin } from "@/helpers/waves/wave.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";
import { markMobileLaunchStep } from "@/utils/monitoring/mobileLaunchTiming";

type ServerFeedSeedGateContextValue = {
  readonly expectedPromise: Promise<ServerWaveFeedSeedResult>;
  readonly invalidated: boolean;
  readonly markTerminal: () => void;
  readonly startedAtMs: number;
};

const ServerFeedSeedGateContext =
  createContext<ServerFeedSeedGateContextValue | null>(null);
const SERVER_FEED_SEED_GATE_TIMEOUT_MS = 10_000;

const useServerFeedSeedGate = (): ServerFeedSeedGateContextValue => {
  const value = useContext(ServerFeedSeedGateContext);
  if (!value) {
    throw new Error("Wave server feed seed requires its gate");
  }
  return value;
};

const prepareServerFeedSeed = ({
  isNative,
  result,
  wave,
}: {
  readonly isNative: boolean;
  readonly result: Extract<ServerWaveFeedSeedResult, { ok: true }>;
  readonly wave: ApiWave;
}): { readonly drops: ApiDrop[]; readonly hasNextPage: boolean } => {
  const seedDrops = isNative
    ? result.drops.slice(0, WAVE_DROPS_NATIVE_INITIAL_PARAMS.limit)
    : result.drops;
  const waveMin = toApiWaveMin(wave);

  return {
    drops: seedDrops.map((drop) => ({ ...drop, wave: waveMin })),
    hasNextPage: result.hasNextPage || result.drops.length > seedDrops.length,
  };
};

export function WaveServerFeedSeedGate({
  children,
  waveId,
}: {
  readonly children: ReactNode;
  readonly waveId: string;
}) {
  const { isCapacitor } = useCapacitor();
  const [startedAtMs] = useState(getWaveFeedTelemetryStartedAtMs);
  const [invalidated, setInvalidated] = useState(false);
  const [expectedPromise] = useState<Promise<ServerWaveFeedSeedResult>>(
    () => new Promise(() => {})
  );
  const startedRef = useRef(false);
  const terminalRef = useRef(false);
  const {
    registerWave,
    serverFeedSeed: { expire, registerPending },
  } = useMyStream();
  const markTerminal = useCallback(() => {
    terminalRef.current = true;
  }, []);

  useLayoutEffect(() => {
    registerPending(waveId, expectedPromise);
    if (!startedRef.current) {
      startedRef.current = true;
      trackWaveFeedLoadStart({
        hadCachedDrops: false,
        isNative: isCapacitor,
        loadSource: "server_initial",
      });
    }

    return () => {
      expire(waveId, expectedPromise);
    };
  }, [expectedPromise, expire, isCapacitor, registerPending, waveId]);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      if (terminalRef.current) {
        return;
      }

      terminalRef.current = true;
      setInvalidated(true);
      expire(waveId, expectedPromise);
      trackWaveFeedLoadTerminalFromError({
        error: createWaveFeedUnavailableError(),
        hadCachedDrops: false,
        isNative: isCapacitor,
        loadSource: "server_initial",
        remainedUnavailable: false,
        startedAtMs,
      });
      registerWave(waveId, true);
    }, SERVER_FEED_SEED_GATE_TIMEOUT_MS);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [
    expectedPromise,
    expire,
    isCapacitor,
    registerWave,
    startedAtMs,
    waveId,
  ]);

  useLayoutEffect(() => {
    const handleProfileSwitch = () => {
      expire(waveId, expectedPromise);
      if (!terminalRef.current) {
        terminalRef.current = true;
        setInvalidated(true);
        trackWaveFeedLoadTerminalFromError({
          error: createWaveFeedAbortError(),
          hadCachedDrops: false,
          isNative: isCapacitor,
          loadSource: "server_initial",
          remainedUnavailable: false,
          startedAtMs,
        });
      }
      // DOM event dispatch runs every profile-switch listener synchronously.
      // Waiting for the microtask guarantees the store has invalidated its
      // seed guard and cleared any applied data before current-auth fetching.
      globalThis.queueMicrotask(() => {
        registerWave(waveId, true);
      });
    };

    globalThis.addEventListener(PROFILE_SWITCHED_EVENT, handleProfileSwitch);
    return () => {
      globalThis.removeEventListener(
        PROFILE_SWITCHED_EVENT,
        handleProfileSwitch
      );
    };
  }, [
    expectedPromise,
    expire,
    isCapacitor,
    registerWave,
    startedAtMs,
    waveId,
  ]);

  const contextValue = useMemo<ServerFeedSeedGateContextValue>(
    () => ({ expectedPromise, invalidated, markTerminal, startedAtMs }),
    [expectedPromise, invalidated, markTerminal, startedAtMs]
  );

  return (
    <ServerFeedSeedGateContext value={contextValue}>
      {children}
    </ServerFeedSeedGateContext>
  );
}

function ResolvedServerFeedSeed({
  expectedPromise,
  invalidated,
  isNative,
  onTerminal,
  promise,
  startedAtMs,
  wave,
  waveId,
}: {
  readonly expectedPromise: Promise<ServerWaveFeedSeedResult>;
  readonly invalidated: boolean;
  readonly isNative: boolean;
  readonly onTerminal: () => void;
  readonly promise: Promise<ServerWaveFeedSeedResult>;
  readonly startedAtMs: number;
  readonly wave: ApiWave;
  readonly waveId: string;
}) {
  const result = use(promise);
  const {
    registerWave,
    serverFeedSeed: { apply, clearPending, replacePending },
  } = useMyStream();
  const didApplyRef = useRef(false);
  const terminalRef = useRef(false);

  useEffect(() => {
    if (terminalRef.current) {
      return;
    }
    if (invalidated) {
      clearPending(waveId, promise);
      terminalRef.current = true;
      return;
    }

    const didReplace = replacePending(waveId, expectedPromise, promise);
    if (!didReplace) {
      terminalRef.current = true;
      onTerminal();
      trackWaveFeedLoadTerminalFromError({
        error: createWaveFeedUnavailableError(),
        hadCachedDrops: false,
        isNative,
        loadSource: "server_initial",
        remainedUnavailable: false,
        startedAtMs,
      });
      return;
    }
    if (!result.ok || result.waveId !== waveId || wave.id !== waveId) {
      clearPending(waveId, promise);
      terminalRef.current = true;
      onTerminal();
      trackWaveFeedLoadTerminalFromError({
        error: createWaveFeedUnavailableError(),
        hadCachedDrops: false,
        isNative,
        loadSource: "server_initial",
        remainedUnavailable: false,
        startedAtMs,
      });
      return;
    }

    const { drops, hasNextPage } = prepareServerFeedSeed({
      isNative,
      result,
      wave,
    });

    const didApply = apply({
      drops,
      hasNextPage,
      onReady: () => {
        registerWave(waveId, true);
      },
      promise,
      waveId,
    });
    clearPending(waveId, promise);
    if (!didApply) {
      terminalRef.current = true;
      onTerminal();
      trackWaveFeedLoadTerminalFromError({
        error: createWaveFeedUnavailableError(),
        hadCachedDrops: false,
        isNative,
        loadSource: "server_initial",
        remainedUnavailable: false,
        startedAtMs,
      });
      return;
    }
    didApplyRef.current = true;
    terminalRef.current = true;
    onTerminal();
    markMobileLaunchStep("wave_messages_loaded");
    trackWaveFeedLoadSuccess({
      dropCount: drops.length,
      hadCachedDrops: false,
      isNative,
      loadSource: "server_initial",
      startedAtMs,
    });
  }, [
    apply,
    clearPending,
    expectedPromise,
    invalidated,
    isNative,
    onTerminal,
    promise,
    registerWave,
    replacePending,
    result,
    startedAtMs,
    wave,
    waveId,
  ]);

  useEffect(() => {
    if (!invalidated && !didApplyRef.current) {
      registerWave(waveId, true);
    }
  }, [invalidated, registerWave, waveId]);

  return null;
}

export default function WaveServerFeedSeed({
  promise,
  wave,
  waveId,
}: {
  readonly promise: Promise<ServerWaveFeedSeedResult>;
  readonly wave: ApiWave;
  readonly waveId: string;
}) {
  const { isCapacitor } = useCapacitor();
  const { expectedPromise, invalidated, markTerminal, startedAtMs } =
    useServerFeedSeedGate();

  return (
    <Suspense fallback={null}>
      <ResolvedServerFeedSeed
        expectedPromise={expectedPromise}
        invalidated={invalidated}
        isNative={isCapacitor}
        onTerminal={markTerminal}
        promise={promise}
        startedAtMs={startedAtMs}
        wave={wave}
        waveId={waveId}
      />
    </Suspense>
  );
}
