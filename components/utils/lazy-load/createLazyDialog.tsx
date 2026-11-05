"use client";

import { useState, type ComponentType, type ReactElement } from "react";

import { createLazyComponentLoader } from "./createLazyComponentLoader";
import { CancelOnEscapeWhileLoading } from "./EscapeWhileLoading";

interface DialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

interface LazyDialog<P extends DialogProps> {
  // Drop-in replacement for the statically imported dialog, with its props.
  readonly Dialog: (props: P) => ReactElement | null;
  // Starts fetching the chunk now, for example on hover or focus.
  readonly preload: () => void;
}

// For a dialog that callers keep mounted and toggle with `isOpen`. Nothing is
// fetched or mounted before the first open. From then on it stays mounted, as
// the static import did, so close transitions and in-progress state survive a
// close and reopen. Once the chunk is cached the dialog renders in the same
// commit as the open. While the chunk is still loading, Escape closes the
// pending dialog; once the dialog mounts it owns Escape again.
export function createLazyDialog<P extends DialogProps>(
  importComponent: () => Promise<{ readonly default: ComponentType<P> }>
): LazyDialog<P> {
  const loader = createLazyComponentLoader<P>(importComponent);
  const LoadedDialog = loader.Loaded;

  function Dialog(props: P) {
    const [hasBeenOpened, setHasBeenOpened] = useState(props.isOpen);

    if (props.isOpen && !hasBeenOpened) {
      setHasBeenOpened(true);
    }

    const onCancel = props.isOpen ? props.onClose : undefined;
    const isReady = loader.useIsReady({
      enabled: hasBeenOpened,
      onError: onCancel,
    });

    if (!hasBeenOpened) {
      return null;
    }

    if (!isReady) {
      return <CancelOnEscapeWhileLoading onEscape={onCancel} />;
    }

    return <LoadedDialog {...props} />;
  }

  return { Dialog, preload: loader.preload };
}
