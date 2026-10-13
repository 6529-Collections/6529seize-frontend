"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import {
  CancelOnEscapeWhileLoading,
  EscapeWhileLoadingProvider,
} from "@/components/utils/lazy-load/EscapeWhileLoading";

import type HeaderSearchModalComponent from "./HeaderSearchModal";

type HeaderSearchModalProps = ComponentProps<typeof HeaderSearchModalComponent>;

const loadHeaderSearchModal = () => import("./HeaderSearchModal");

// Starts fetching the modal chunk ahead of the first open (hover, focus).
// Opening never depends on this: the dynamic component loads on demand too.
export const preloadHeaderSearchModal = (): void => {
  loadHeaderSearchModal().catch(() => undefined);
};

const DynamicHeaderSearchModal = dynamic<HeaderSearchModalProps>(
  loadHeaderSearchModal,
  { ssr: false, loading: () => <CancelOnEscapeWhileLoading /> }
);

// Callers already mount this only while search is open, so the chunk is not
// fetched until the first open. The modal focuses its input when it mounts, so
// a shortcut pressed before the chunk arrives still lands focus on load. An
// Escape pressed before then closes search, like it does once the modal is up.
export default function LazyHeaderSearchModal(
  props: Readonly<HeaderSearchModalProps>
) {
  return (
    <EscapeWhileLoadingProvider onEscape={props.onClose}>
      <DynamicHeaderSearchModal {...props} />
    </EscapeWhileLoadingProvider>
  );
}
