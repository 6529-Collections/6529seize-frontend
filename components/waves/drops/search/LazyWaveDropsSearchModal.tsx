"use client";

import dynamic from "next/dynamic";
import { useState, type ComponentProps } from "react";

import type WaveDropsSearchModalComponent from "./WaveDropsSearchModal";

type WaveDropsSearchModalProps = ComponentProps<
  typeof WaveDropsSearchModalComponent
>;

const loadWaveDropsSearchModal = () => import("./WaveDropsSearchModal");

// Starts fetching the modal chunk ahead of the first open (hover, focus).
// Opening never depends on this: the dynamic component loads on demand too.
export const preloadWaveDropsSearchModal = (): void => {
  loadWaveDropsSearchModal().catch(() => undefined);
};

const DynamicWaveDropsSearchModal = dynamic<WaveDropsSearchModalProps>(
  loadWaveDropsSearchModal,
  { ssr: false, loading: () => null }
);

// The search modal pulls in the markdown preview pipeline, so it is neither
// fetched nor mounted until the first open. After that it stays mounted, as it
// did when it was imported statically, so the query and filters survive a
// close and reopen. The modal focuses its input once it mounts open, so a
// shortcut pressed before the chunk arrives still lands focus on load.
export default function LazyWaveDropsSearchModal(
  props: Readonly<WaveDropsSearchModalProps>
) {
  const [hasBeenOpened, setHasBeenOpened] = useState(props.isOpen);

  if (props.isOpen && !hasBeenOpened) {
    setHasBeenOpened(true);
  }

  if (!hasBeenOpened) {
    return null;
  }

  return <DynamicWaveDropsSearchModal {...props} />;
}
