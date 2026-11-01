"use client";

import { usePathname } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { isEncryptedMessagesPathname } from "@/helpers/navigation.helpers";
import type { E2eeBackupManager } from "@/lib/e2ee/backup";
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
import type { E2eeEngineSnapshot, E2eeEngineStore } from "./e2eeEngineStore";
import { type E2eeEngineRun, startE2eeEngineRun } from "./e2eeEngineRun";
import {
  hasE2eeEnrollmentMarker,
  setE2eeEnrollmentMarker,
} from "./e2eeLocalState";
import { E2eeSignOutPromptHost } from "./signout/E2eeSignOutPromptHost";
import { useE2eeEngineDeps } from "./useE2eeEngineDeps";
import { useLoginE2eePrefetch } from "./useLoginE2eePrefetch";

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
      readonly backup: E2eeBackupManager | null;
    }
  | { readonly key: string; readonly phase: "failed"; readonly error: string }
  | { readonly key: string; readonly phase: "elsewhere" };

interface Attempt {
  readonly count: number;
  /** Set by "Use here": take the engine from the tab that holds it. */
  readonly takeOver: boolean;
}

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
  useLoginE2eePrefetch();

  const profileId = connectedProfile?.id ?? null;
  const wallet = address ? address.toLowerCase() : null;
  const isProxy = activeProfileProxy !== null;
  const sessionKey =
    profileId && wallet && !isProxy ? `${profileId}:${wallet}` : null;

  const [attempt, setAttempt] = useState<Attempt>({
    count: 0,
    takeOver: false,
  });
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
      ? `${sessionKey}:${nextSession.generation}:${attempt.count}`
      : null;

  const [loadState, setLoadState] = useState<LoadState | null>(null);

  // Runs in this tab, by profile id; a new run waits for the previous one
  // to stop so this tab never holds two engines (or its own lock) at once.
  const runs = useRef(new Map<string, E2eeEngineRun>());
  const stopped = useRef<Promise<void>>(Promise.resolve());
  const takeOver = attempt.takeOver;

  useEffect(() => {
    if (activeKey === null || profileId === null || wallet === null) {
      return;
    }
    let active = true;
    const update = (next: LoadState | null) => {
      if (active) {
        setLoadState(next);
      }
    };
    const run = startE2eeEngineRun({
      profileId,
      wallet,
      takeOver,
      after: stopped.current,
      loadModules,
      buildDeps,
      onSnapshot: (snapshot) => updateEnrollmentMarker(profileId, snapshot),
      onElsewhere: () => update({ key: activeKey, phase: "elsewhere" }),
      onAcquired: () => update(null),
      onLoaded: ({ engine, store, backup }) =>
        update({ key: activeKey, phase: "loaded", engine, store, backup }),
      onFailed: (error) => update({ key: activeKey, phase: "failed", error }),
    });
    const tracked = runs.current;
    tracked.set(profileId, run);

    return () => {
      active = false;
      if (tracked.get(profileId) === run) {
        tracked.delete(profileId);
      }
      stopped.current = run.stop();
    };
  }, [activeKey, buildDeps, loadModules, profileId, takeOver, wallet]);

  /** Hands every engine in this tab over (before removing local data). */
  const releaseEngines = useCallback(async () => {
    await Promise.all(
      [...runs.current.values()].map((run) => run.yieldToOtherTab())
    );
  }, []);

  const restart = useCallback(
    () => setAttempt((value) => ({ count: value.count + 1, takeOver: false })),
    []
  );
  const takeOverHere = useCallback(
    () => setAttempt((value) => ({ count: value.count + 1, takeOver: true })),
    []
  );

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
      backup: loaded?.backup ?? null,
      loadError:
        availability === "failed" && loadState?.phase === "failed"
          ? loadState.error
          : null,
      restart,
      takeOverHere,
    };
  }, [
    activeKey,
    isProxy,
    loadState,
    profileId,
    restart,
    sessionKey,
    takeOverHere,
  ]);

  return (
    <E2eeContext.Provider value={value}>
      {children}
      <E2eeSignOutPromptHost
        profileId={isProxy ? null : profileId}
        releaseEngines={releaseEngines}
      />
    </E2eeContext.Provider>
  );
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
