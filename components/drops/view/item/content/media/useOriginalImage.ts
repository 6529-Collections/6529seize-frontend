"use client";

import { isGifImageUrl } from "@/helpers/gif-preview.helpers";
import { useState } from "react";

export function useOriginalImage(src: string, allowStillImage = false) {
  const [state, setState] = useState({
    src,
    requested: false,
    loaded: false,
    failed: false,
  });
  if (state.src !== src)
    setState({ src, requested: false, loaded: false, failed: false });

  const canViewOriginal =
    (allowStillImage || isGifImageUrl(src)) && /^(https?:|ipfs:)/i.test(src);
  const requested = canViewOriginal && state.src === src && state.requested;

  return {
    canViewOriginal,
    requested,
    showingOriginal: requested && state.loaded,
    loading: requested && !state.loaded,
    failed: state.src === src && state.failed,
    toggle: () => {
      if (canViewOriginal)
        setState({ src, requested: !requested, loaded: false, failed: false });
    },
    onLoad: () =>
      setState((current) =>
        current === state ? { ...current, loaded: true } : current
      ),
    onError: () =>
      setState((current) =>
        current === state
          ? { src, requested: false, loaded: false, failed: true }
          : current
      ),
  };
}

export type OriginalImageQuality = ReturnType<typeof useOriginalImage>;
