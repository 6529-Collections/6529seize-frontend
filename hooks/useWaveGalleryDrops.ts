"use client";

import { useWaveDrops } from "./useWaveDrops";

const GALLERY_DROPS_LIMIT = 20;

export function useWaveGalleryDrops(waveId: string) {
  return useWaveDrops({
    waveId,
    containsMedia: true,
    limit: GALLERY_DROPS_LIMIT,
  });
}
