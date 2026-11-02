"use client";

import type { SingleWaveDropProps } from "@/components/waves/drops/participation/participationRenderer.types";
import SingleWaveDropLoading from "./SingleWaveDropLoading";

import { singleWaveDropLoader } from "./singleWaveDropLoader";

const LoadedSingleWaveDrop = singleWaveDropLoader.Loaded;

// The single drop view carries the chat composer, so a surface that only
// sometimes opens it loads it on demand instead of with the page. A chunk that
// is already cached renders in the same commit as the open. A chunk that fails
// to load closes the panel so the user can open the drop again.
export default function LazySingleWaveDrop(
  props: Readonly<SingleWaveDropProps>
) {
  const isReady = singleWaveDropLoader.useIsReady({ onError: props.onClose });

  if (!isReady) {
    return <SingleWaveDropLoading onClose={props.onClose} />;
  }

  return <LoadedSingleWaveDrop {...props} />;
}
