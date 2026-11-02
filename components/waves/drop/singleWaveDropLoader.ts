import { createLazyComponentLoader } from "@/components/utils/lazy-load/createLazyComponentLoader";
import type { SingleWaveDropProps } from "@/components/waves/drops/participation/participationRenderer.types";

// Kept apart from LazySingleWaveDrop so a page can start fetching the single
// drop view as soon as a drop is requested, without importing the placeholder.
export const singleWaveDropLoader =
  createLazyComponentLoader<SingleWaveDropProps>(async () => {
    const { SingleWaveDrop } = await import("./SingleWaveDrop");
    return { default: SingleWaveDrop };
  });
