"use client";

import type { ComponentProps } from "react";

import { createLazyComponentLoader } from "@/components/utils/lazy-load/createLazyComponentLoader";
import { CancelOnEscapeWhileLoading } from "@/components/utils/lazy-load/EscapeWhileLoading";

import type HeaderSearchModalComponent from "./HeaderSearchModal";

type HeaderSearchModalProps = ComponentProps<typeof HeaderSearchModalComponent>;

const headerSearchModalLoader =
  createLazyComponentLoader<HeaderSearchModalProps>(
    () => import("./HeaderSearchModal")
  );

// Fetches the modal chunk ahead of the first open (hover, focus, idle). Opening
// never depends on this: the modal loads on demand too.
export const preloadHeaderSearchModal = headerSearchModalLoader.preload;
export const useHeaderSearchModalIdlePreload =
  headerSearchModalLoader.usePreloadWhenIdle;

const LoadedHeaderSearchModal = headerSearchModalLoader.Loaded;

// Callers already mount this only while search is open, so the chunk is not
// fetched until the first open unless it was preloaded. Once it is cached the
// modal renders in the same commit as the open. The modal focuses its input
// when it mounts, so a shortcut pressed before the chunk arrives still lands
// focus on load. An Escape pressed before then closes search, like it does once
// the modal is up.
export default function LazyHeaderSearchModal(
  props: Readonly<HeaderSearchModalProps>
) {
  const isReady = headerSearchModalLoader.useIsReady({
    onError: props.onClose,
  });

  if (!isReady) {
    return <CancelOnEscapeWhileLoading onEscape={props.onClose} />;
  }

  return <LoadedHeaderSearchModal {...props} />;
}
