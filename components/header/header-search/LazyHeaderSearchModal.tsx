"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import type HeaderSearchModalComponent from "./HeaderSearchModal";

type HeaderSearchModalProps = ComponentProps<typeof HeaderSearchModalComponent>;

const loadHeaderSearchModal = () => import("./HeaderSearchModal");

// Starts fetching the modal chunk ahead of the first open (hover, focus).
// Opening never depends on this: the dynamic component loads on demand too.
export const preloadHeaderSearchModal = (): void => {
  loadHeaderSearchModal().catch(() => undefined);
};

// Callers already mount this only while search is open, so the chunk is not
// fetched until the first open. The modal focuses its input when it mounts, so
// a shortcut pressed before the chunk arrives still lands focus on load.
const LazyHeaderSearchModal = dynamic<HeaderSearchModalProps>(
  loadHeaderSearchModal,
  { ssr: false, loading: () => null }
);

export default LazyHeaderSearchModal;
