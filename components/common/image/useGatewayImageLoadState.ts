"use client";

import { getMediaGatewayFallbackUrls } from "@/components/nft-image/utils/gateway-fallback";
import { useMemo, useState } from "react";

type GatewayImageLoadMode = "optimized" | "unoptimized" | "placeholder";

type GatewayImageLoadState = {
  src: string | null;
  candidateIndex: number;
  mode: GatewayImageLoadMode;
};

export function useGatewayImageLoadState(src: string | null = null) {
  const normalizedSrc = src;
  const candidateUrls = useMemo(
    () => (normalizedSrc ? getMediaGatewayFallbackUrls(normalizedSrc) : []),
    [normalizedSrc]
  );

  const [loadState, setLoadState] = useState<GatewayImageLoadState>({
    src: null,
    candidateIndex: 0,
    mode: "optimized",
  });

  const currentState: GatewayImageLoadState =
    loadState.src === normalizedSrc
      ? loadState
      : {
          src: normalizedSrc,
          candidateIndex: 0,
          mode: "optimized",
        };

  const activeSrc = candidateUrls[currentState.candidateIndex] ?? null;
  const isPlaceholder =
    normalizedSrc === null ||
    activeSrc === null ||
    currentState.mode === "placeholder";

  const handleError = () => {
    if (normalizedSrc === null) {
      return;
    }

    if (currentState.mode === "optimized") {
      setLoadState({
        src: normalizedSrc,
        candidateIndex: currentState.candidateIndex,
        mode: "unoptimized",
      });
      return;
    }

    if (currentState.candidateIndex + 1 < candidateUrls.length) {
      setLoadState({
        src: normalizedSrc,
        candidateIndex: currentState.candidateIndex + 1,
        mode: "optimized",
      });
      return;
    }

    setLoadState({
      src: normalizedSrc,
      candidateIndex: currentState.candidateIndex,
      mode: "placeholder",
    });
  };

  return {
    activeSrc,
    isPlaceholder,
    unoptimized: currentState.mode === "unoptimized",
    handleError,
  };
}
