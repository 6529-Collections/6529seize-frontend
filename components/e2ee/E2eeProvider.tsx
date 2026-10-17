"use client";

import { usePathname } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { isEncryptedMessagesPathname } from "@/helpers/navigation.helpers";
import type { E2eeEngine } from "@/lib/e2ee/types";
import {
  E2eeContext,
  type E2eeAvailability,
  type E2eeContextValue,
} from "./E2eeContext";
import {
  type LoadE2eeEngineModules,
  loadE2eeEngineModules,
} from "./e2eeEngineLoader";
import {
  createE2eeEngineStore,
  type E2eeEngineSnapshot,
  type E2eeEngineStore,
} from "./e2eeEngineStore";
import { getE2eeErrorCode } from "./e2eeErrors";
import {
  hasE2eeEnrollmentMarker,
  setE2eeEnrollmentMarker,
} from "./e2eeLocalState";
import { useE2eeEngineDeps } from "./useE2eeEngineDeps";

interface E2eeProviderProps {
  readonly children: ReactNode;
  /** Test seam; production uses the dynamic-import loader. */
  readonly loadModules?: LoadE2eeEngineModules | undefined;
}

type LoadState =
  | {
      readonly key: string;
      readonly phase: "loaded";
      readonly engine: E2eeEngine;
      readonly store: E2eeEngineStore;
    }
  | { readonly key: string; readonly phase: "failed"; readonly error: string };

// Same-tab marker changes do not fire "storage" events; notify directly.
const markerListeners = new Set<() => void>();

const subscribeToMarker = (listener: () => void) => {
  markerListeners.add(listener);
  globalThis.addEventListener("storage", listener);
  return () => {
    markerListeners.delete(listener);
    globalThis.removeEventListener("storage", listener);
  };
};

const updateEnrollmentMarker = (
  profileId: string,
  snapshot: E2eeEngineSnapshot
) => {
  let enrolled: boolean | null = null;
  if (snapshot.status === "ready") {
    enrolled = true;
  } else if (snapshot.status === "needs-enrollment") {
    enrolled = false;
  }
  if (enrolled === null || hasE2eeEnrollmentMarker(profileId) === enrolled) {
    return;
  }
  setE2eeEnrollmentMarker(profileId, enrolled);
  for (const listener of [...markerListeners]) {
    listener();
  }
};

interface SessionState {
  readonly key: string | null;
  readonly generation: number;
  readonly wanted: boolean;
}

function getNextSession(
  session: SessionState,
  sessionKey: string | null,
  wantsEngine: boolean
): SessionState {
  let next = session;
  if (next.key !== sessionKey) {
    next = { key: sessionKey, generation: next.generation + 1, wanted: false };
  }
  if (wantsEngine && sessionKey !== null && !next.wanted) {
    next = { ...next, wanted: true };
  }
  return next;
}

const useEnrollmentMarker = (profileId: string | null): boolean =>
  useSyncExternalStore(
    subscribeToMarker,
    () => (profileId ? hasE2eeEnrollmentMarker(profileId) : false),
    () => false
  );

function getAvailability({
  sessionKey,
  isProxy,
  activeKey,
  loadState,
}: {
  readonly sessionKey: string | null;
  readonly isProxy: boolean;
  readonly activeKey: string | null;
  readonly loadState: LoadState | null;
}): E2eeAvailability {
  if (isProxy) {
    return "proxy";
  }
  if (sessionKey === null) {
    return "unavailable";
  }
  if (activeKey === null) {
    return "idle";
  }
  if (loadState?.key !== activeKey) {
    return "loading";
  }
  return loadState.phase;
}

function E2eeProviderEnabled({
  children,
  loadModules = loadE2eeEngineModules,
}: E2eeProviderProps) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { address } = useSeizeConnectContext();
  const pathname = usePathname();
  const buildDeps = useE2eeEngineDeps();

  const profileId = connectedProfile?.id ?? null;
  const wallet = address ? address.toLowerCase() : null;
  const isProxy = activeProfileProxy !== null;
  const sessionKey =
    profileId && wallet && !isProxy ? `${profileId}:${wallet}` : null;

  const [attempt, setAttempt] = useState(0);
  const hasMarker = useEnrollmentMarker(profileId);
  const wantsEngine = isEncryptedMessagesPathname(pathname) || hasMarker;

  // Each profile/wallet session gets a new generation, so an engine from an
  // earlier session is never mistaken for the current one. Once wanted, a
  // session keeps its engine while browsing elsewhere so a signature or sync
  // in flight is not cut off by navigation.
  const [session, setSession] = useState<SessionState>({
    key: sessionKey,
    generation: 0,
    wanted: false,
  });
  const nextSession = getNextSession(session, sessionKey, wantsEngine);
  if (nextSession !== session) {
    setSession(nextSession);
  }
  const activeKey =
    sessionKey !== null && nextSession.wanted
      ? `${sessionKey}:${nextSession.generation}:${attempt}`
      : null;

  const [loadState, setLoadState] = useState<LoadState | null>(null);

  useEffect(() => {
    if (activeKey === null || profileId === null || wallet === null) {
      return;
    }
    const run = { cancelled: false };
    // A function, so the check is re-read after each await.
    const isCancelled = () => run.cancelled;
    let engine: E2eeEngine | null = null;
    let store: E2eeEngineStore | null = null;

    const start = async () => {
      try {
        const modules = await loadModules();
        if (isCancelled()) {
          return;
        }
        const created = await modules.createE2eeEngine(
          buildDeps({
            profileId,
            wallet,
            api: modules.createE2eeApiClient(),
          })
        );
        if (isCancelled()) {
          created.dispose();
          return;
        }
        engine = created;
        store = createE2eeEngineStore(created, (snapshot) =>
          updateEnrollmentMarker(profileId, snapshot)
        );
        updateEnrollmentMarker(profileId, store.getSnapshot());
        setLoadState({ key: activeKey, phase: "loaded", engine, store });
      } catch (error) {
        if (!isCancelled()) {
          setLoadState({
            key: activeKey,
            phase: "failed",
            error: getE2eeErrorCode(error) ?? "E2EE_LOAD_FAILED",
          });
        }
      }
    };

    void start();

    return () => {
      run.cancelled = true;
      store?.dispose();
      engine?.dispose();
    };
  }, [activeKey, buildDeps, loadModules, profileId, wallet]);

  const restart = useCallback(() => setAttempt((value) => value + 1), []);

  const value = useMemo<E2eeContextValue>(() => {
    const availability = getAvailability({
      sessionKey,
      isProxy,
      activeKey,
      loadState,
    });
    const loaded =
      availability === "loaded" && loadState?.phase === "loaded"
        ? loadState
        : null;
    return {
      availability,
      profileId: isProxy ? null : profileId,
      engine: loaded?.engine ?? null,
      store: loaded?.store ?? null,
      loadError:
        availability === "failed" && loadState?.phase === "failed"
          ? loadState.error
          : null,
      restart,
    };
  }, [activeKey, isProxy, loadState, profileId, restart, sessionKey]);

  return <E2eeContext.Provider value={value}>{children}</E2eeContext.Provider>;
}

/**
 * Owns the encrypted-messages engine for the signed-in profile (D109). With
 * the flag off it renders children only. With it on, it loads the engine
 * lazily (encrypted route opened, or this browser already enrolled a device
 * for the profile), recreates it on profile or wallet switch and disposes it
 * on logout. Proxy sessions never get an engine.
 */
export default function E2eeProvider({
  children,
  loadModules,
}: E2eeProviderProps) {
  if (!isE2eeEnabled()) {
    return <>{children}</>;
  }
  return (
    <E2eeProviderEnabled loadModules={loadModules}>
      {children}
    </E2eeProviderEnabled>
  );
}
