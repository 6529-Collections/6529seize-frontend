"use client";

import {
  type ReactNode,
  useCallback,
  useSyncExternalStore,
} from "react";

import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";

const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

export default function PublicWaveFeedGate({
  children,
  fallback,
  waveId,
}: {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
  readonly waveId: string;
}) {
  const myStream = useMyStreamOptional();
  const store = myStream?.waveMessagesStore;
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );

  const getSnapshot = useCallback(
    () => store?.getData(waveId),
    [store, waveId]
  );
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!store) {
        return () => {};
      }

      const listener = () => onStoreChange();
      store.subscribe(waveId, listener);
      return () => store.unsubscribe(waveId, listener);
    },
    [store, waveId]
  );
  const waveMessages = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => undefined
  );

  const activeWaveId = myStream?.activeWave.id ?? null;
  const hasMismatchedActiveWave =
    hydrated && activeWaveId !== null && activeWaveId !== waveId;
  const hasInteractiveFeed =
    waveMessages !== undefined && !waveMessages.isLoading;

  const showFallback = !hasMismatchedActiveWave && !hasInteractiveFeed;

  return (
    <div className="tailwind-scope tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
      <div
        aria-hidden={showFallback}
        className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col"
        inert={showFallback ? true : undefined}
      >
        {children}
      </div>
      {showFallback ? (
        <div className="tw-absolute tw-inset-0 tw-z-10 tw-overflow-y-auto tw-bg-iron-950">
          {fallback}
        </div>
      ) : null}
    </div>
  );
}
