"use client";

import { isGifImageUrl } from "@/helpers/gif-preview.helpers";
import { useCallback, useState } from "react";

export function useOriginalImage(src: string, allowStillImage = false) {
  const [state, setState] = useState({
    src,
    requested: false,
    loaded: false,
    failed: false,
    automaticHandled: false,
  });
  if (state.src !== src)
    setState({
      src,
      requested: false,
      loaded: false,
      failed: false,
      automaticHandled: false,
    });

  const canViewOriginal =
    (allowStillImage || isGifImageUrl(src)) && /^(https?:|ipfs:)/i.test(src);
  const requested = canViewOriginal && state.src === src && state.requested;
  const requestAutomatically = useCallback(() => {
    if (!canViewOriginal) return;
    setState((current) => {
      // Respect manual quality choices and do not retry a failed original on
      // every preview load, retry, or popup mount.
      if (current.src !== src || current.automaticHandled) return current;
      return {
        ...current,
        requested: true,
        loaded: false,
        failed: false,
        automaticHandled: true,
      };
    });
  }, [src, canViewOriginal]);

  return {
    canViewOriginal,
    requested,
    showingOriginal: requested && state.loaded,
    loading: requested && !state.loaded,
    failed: state.src === src && state.failed,
    requestAutomatically,
    toggle: () => {
      if (canViewOriginal)
        setState((current) =>
          current.src !== src
            ? current
            : {
                ...current,
                requested: !current.requested,
                loaded: false,
                failed: false,
                automaticHandled: true,
              }
        );
    },
    onLoad: () =>
      setState((current) =>
        current === state ? { ...current, loaded: true } : current
      ),
    onError: () =>
      setState((current) =>
        current === state
          ? { ...current, requested: false, loaded: false, failed: true }
          : current
      ),
  };
}

export type OriginalImageQuality = ReturnType<typeof useOriginalImage>;
