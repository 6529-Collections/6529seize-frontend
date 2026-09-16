"use client";

import { createPositioner, type Positioner } from "masonic";
import { useState } from "react";

type Layout = { ids: readonly string[]; width: number; positioner: Positioner };
const GUTTER = 16;

export function createCurationMasonryLayout(
  ids: readonly string[],
  width: number,
  previous?: Layout
): Layout {
  // Appending pages does not invalidate existing positions or mounted media.
  if (
    previous?.width === width &&
    previous.ids.every((id, index) => ids[index] === id)
  ) {
    return { ...previous, ids };
  }
  const columns = Math.max(1, Math.floor((width + GUTTER) / (300 + GUTTER)));
  const positioner = createPositioner(
    columns,
    Math.max(1, (width - GUTTER * (columns - 1)) / columns),
    GUTTER
  );
  if (previous) {
    // Masonic caches heights by index. Reassociate them by post ID after a move;
    // keeping the React keys stable preserves media state for visible cards.
    const heights = new Map(
      previous.ids.map((id, index) => [
        id,
        previous.positioner.get(index)?.height,
      ])
    );
    ids.forEach((id, index) => positioner.set(index, heights.get(id) ?? 420));
  }
  return { ids, width, positioner };
}

export function useCurationMasonryPositioner(
  ids: readonly string[],
  width: number
) {
  const [layout, setLayout] = useState(() =>
    createCurationMasonryLayout(ids, width)
  );
  if (
    layout.width !== width ||
    layout.ids.length !== ids.length ||
    layout.ids.some((id, index) => id !== ids[index])
  ) {
    const next = createCurationMasonryLayout(ids, width, layout);
    setLayout(next);
    return next.positioner;
  }
  return layout.positioner;
}
