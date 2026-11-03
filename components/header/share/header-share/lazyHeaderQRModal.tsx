"use client";

import type { ComponentProps, ReactElement } from "react";

import { createLazyComponentLoader } from "@/components/utils/lazy-load/createLazyComponentLoader";
import { CancelOnEscapeWhileLoading } from "@/components/utils/lazy-load/EscapeWhileLoading";

import type { HeaderPageShareModal as HeaderPageShareModalComponent } from "./HeaderQRModal";

type HeaderQRModalProps = ComponentProps<typeof HeaderPageShareModalComponent>;

// The QR share and device-connect modal (QR encoding, share targets and the
// connection-share flow) is only needed once someone opens it, so it stays out
// of the bundle every page downloads. Both variants share one chunk.
const loadHeaderQRModal = () => import("./HeaderQRModal");

const pageShareModalLoader = createLazyComponentLoader<HeaderQRModalProps>(
  async () => ({ default: (await loadHeaderQRModal()).HeaderPageShareModal })
);
const connectModalLoader = createLazyComponentLoader<HeaderQRModalProps>(
  async () => ({ default: (await loadHeaderQRModal()).HeaderConnectModal })
);

// Fetches the modal chunk ahead of the first open (hover, focus, an open
// account menu). Opening never depends on this: the modal loads on demand too.
export const preloadHeaderQRModal = (): void => {
  pageShareModalLoader.preload();
  connectModalLoader.preload();
};

type Loader = typeof pageShareModalLoader;

// Callers mount these only after the first open request and keep them mounted,
// so the modal's own open and close transitions run as before. Once the chunk
// is cached the modal renders in the same commit. While it is still loading,
// Escape closes the pending modal; once it mounts the modal owns Escape.
function createLazyHeaderQRModal(loader: Loader) {
  const LoadedHeaderQRModal = loader.Loaded;
  return function LazyHeaderQRModal(
    props: Readonly<HeaderQRModalProps>
  ): ReactElement {
    const onCancel = props.show ? props.onClose : undefined;
    const isReady = loader.useIsReady({ onError: onCancel });

    if (!isReady) {
      return <CancelOnEscapeWhileLoading onEscape={onCancel} />;
    }

    return <LoadedHeaderQRModal {...props} />;
  };
}

export const LazyHeaderPageShareModal =
  createLazyHeaderQRModal(pageShareModalLoader);
export const LazyHeaderConnectModal =
  createLazyHeaderQRModal(connectModalLoader);
