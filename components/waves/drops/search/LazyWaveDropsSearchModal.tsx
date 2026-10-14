"use client";

import { useState, type ComponentProps } from "react";

import { createLazyComponentLoader } from "@/components/utils/lazy-load/createLazyComponentLoader";
import { CancelOnEscapeWhileLoading } from "@/components/utils/lazy-load/EscapeWhileLoading";

import type WaveDropsSearchModalComponent from "./WaveDropsSearchModal";

type WaveDropsSearchModalProps = ComponentProps<
  typeof WaveDropsSearchModalComponent
>;

const waveDropsSearchModalLoader =
  createLazyComponentLoader<WaveDropsSearchModalProps>(
    () => import("./WaveDropsSearchModal")
  );

// Fetches the modal chunk ahead of the first open (hover, focus, idle). Opening
// never depends on this: the modal loads on demand too.
export const preloadWaveDropsSearchModal = waveDropsSearchModalLoader.preload;
export const useWaveDropsSearchModalIdlePreload =
  waveDropsSearchModalLoader.usePreloadWhenIdle;

const LoadedWaveDropsSearchModal = waveDropsSearchModalLoader.Loaded;

// The search modal pulls in the markdown preview pipeline, so it is neither
// fetched nor mounted until the first open. After that it stays mounted, as it
// did when it was imported statically, so the query and filters survive a
// close and reopen. Once the chunk is cached the modal renders in the same
// commit as the open. The modal focuses its input once it mounts open, so a
// shortcut pressed before the chunk arrives still lands focus on load. While
// the chunk is still loading, Escape closes the open search instead of being
// swallowed; once the modal mounts it owns Escape again.
export default function LazyWaveDropsSearchModal(
  props: Readonly<WaveDropsSearchModalProps>
) {
  const [hasBeenOpened, setHasBeenOpened] = useState(props.isOpen);

  if (props.isOpen && !hasBeenOpened) {
    setHasBeenOpened(true);
  }

  const onCancel = props.isOpen ? props.onClose : undefined;
  const isReady = waveDropsSearchModalLoader.useIsReady({
    enabled: hasBeenOpened,
    onError: onCancel,
  });

  if (!hasBeenOpened) {
    return null;
  }

  if (!isReady) {
    return <CancelOnEscapeWhileLoading onEscape={onCancel} />;
  }

  return <LoadedWaveDropsSearchModal {...props} />;
}
