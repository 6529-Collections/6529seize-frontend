"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import type {
  MemesQuickVoteRuntimeIntent,
  MemesQuickVoteRuntimeProps,
} from "./MemesQuickVoteRuntime";

type UseMemesQuickVoteRuntimeLauncherResult = {
  readonly openQuickVote: () => void;
  readonly prefetchQuickVote: () => void;
  readonly resetQuickVoteRuntime: () => void;
  readonly runtimeIntent: MemesQuickVoteRuntimeIntent | null;
  readonly shouldMountRuntime: boolean;
};

const importMemesQuickVoteRuntime = () => import("./MemesQuickVoteRuntime");

let runtimePreloadPromise: ReturnType<
  typeof importMemesQuickVoteRuntime
> | null = null;

const preloadMemesQuickVoteRuntime = async (): ReturnType<
  typeof importMemesQuickVoteRuntime
> => {
  runtimePreloadPromise ??= importMemesQuickVoteRuntime();

  try {
    return await runtimePreloadPromise;
  } catch (error: unknown) {
    runtimePreloadPromise = null;
    throw error;
  }
};

const DynamicMemesQuickVoteRuntime = dynamic<MemesQuickVoteRuntimeProps>(
  () => importMemesQuickVoteRuntime().then((module) => module.default),
  {
    loading: () => null,
    ssr: false,
  }
);

export const useMemesQuickVoteRuntimeLauncher =
  (): UseMemesQuickVoteRuntimeLauncherResult => {
    const [runtimeIntent, setRuntimeIntent] =
      useState<MemesQuickVoteRuntimeIntent | null>(null);
    const nextIntentIdRef = useRef(0);

    const prefetchQuickVote = useCallback(() => {
      if (typeof globalThis.window === "object") {
        void preloadMemesQuickVoteRuntime().catch(() => undefined);
      }
    }, []);

    const openQuickVote = useCallback(() => {
      nextIntentIdRef.current += 1;
      setRuntimeIntent({
        action: "open",
        id: nextIntentIdRef.current,
      });

      if (typeof globalThis.window === "object") {
        void preloadMemesQuickVoteRuntime().catch(() => undefined);
      }
    }, []);

    const resetQuickVoteRuntime = useCallback(() => {
      setRuntimeIntent(null);
    }, []);

    return {
      openQuickVote,
      prefetchQuickVote,
      resetQuickVoteRuntime,
      runtimeIntent,
      shouldMountRuntime: runtimeIntent !== null,
    };
  };

export function LazyMemesQuickVoteRuntime({
  intent,
  onIdle,
}: MemesQuickVoteRuntimeProps) {
  return <DynamicMemesQuickVoteRuntime intent={intent} onIdle={onIdle} />;
}
