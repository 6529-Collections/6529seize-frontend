"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface ViewportGeometry {
  readonly layoutHeight: number;
  readonly visualHeight: number | null;
}

interface LockedLayout<T> {
  readonly value: T;
  readonly viewport: ViewportGeometry;
}

const LAYOUT_VIEWPORT_HEIGHT_PROPERTY = "--layout-viewport-height";
const VIEWPORT_RESTORE_TOLERANCE_PX = 2;
const VIEWPORT_UNLOCK_FALLBACK_MS = 1200;

export const LAYOUT_VIEWPORT_HEIGHT = "var(--layout-viewport-height)";

const getViewportGeometry = (): ViewportGeometry => ({
  layoutHeight: globalThis.innerHeight,
  visualHeight: globalThis.visualViewport?.height ?? null,
});

const hasViewportRestored = (viewport: ViewportGeometry): boolean => {
  const current = getViewportGeometry();
  const hasLayoutRestored =
    current.layoutHeight >=
    viewport.layoutHeight - VIEWPORT_RESTORE_TOLERANCE_PX;
  const hasVisualRestored =
    viewport.visualHeight === null ||
    current.visualHeight === null ||
    current.visualHeight >=
      viewport.visualHeight - VIEWPORT_RESTORE_TOLERANCE_PX;

  return hasLayoutRestored && hasVisualRestored;
};

const waitForViewportRestore = (
  viewport: ViewportGeometry,
  onRestore: () => void
): (() => void) => {
  const controller = new AbortController();

  const finish = () => {
    if (controller.signal.aborted) return;
    controller.abort();
    onRestore();
  };
  const handleViewportChange = () => {
    if (hasViewportRestored(viewport)) finish();
  };
  const timeoutId = globalThis.setTimeout(finish, VIEWPORT_UNLOCK_FALLBACK_MS);

  controller.signal.addEventListener(
    "abort",
    () => globalThis.clearTimeout(timeoutId),
    { once: true }
  );
  globalThis.addEventListener("resize", handleViewportChange, {
    passive: true,
    signal: controller.signal,
  });
  globalThis.visualViewport?.addEventListener("resize", handleViewportChange, {
    passive: true,
    signal: controller.signal,
  });

  return () => controller.abort();
};

export const useViewportLayoutLock = <T>(value: T) => {
  const valueRef = useRef(value);
  const [lockedLayout, setLockedLayout] = useState<LockedLayout<T> | null>(
    null
  );
  const lockedLayoutRef = useRef<LockedLayout<T> | null>(null);
  const lockCountRef = useRef(0);
  const pendingUnlockRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);

  const unlock = useCallback(() => {
    pendingUnlockRef.current?.();
    pendingUnlockRef.current = null;
    lockedLayoutRef.current = null;
    setLockedLayout(null);
  }, []);

  const acquire = useCallback(() => {
    pendingUnlockRef.current?.();
    pendingUnlockRef.current = null;
    lockCountRef.current += 1;

    if (lockedLayoutRef.current === null) {
      const snapshot = {
        value: valueRef.current,
        viewport: getViewportGeometry(),
      };
      lockedLayoutRef.current = snapshot;
      setLockedLayout(snapshot);
    }

    let isReleased = false;
    return () => {
      if (isReleased) return;
      isReleased = true;
      lockCountRef.current = Math.max(0, lockCountRef.current - 1);
      if (lockCountRef.current > 0) return;

      const snapshot = lockedLayoutRef.current;
      if (snapshot === null) return;
      if (hasViewportRestored(snapshot.viewport)) {
        unlock();
        return;
      }

      pendingUnlockRef.current = waitForViewportRestore(
        snapshot.viewport,
        () => {
          pendingUnlockRef.current = null;
          if (lockCountRef.current === 0) unlock();
        }
      );
    };
  }, [unlock]);

  useEffect(
    () => () => {
      pendingUnlockRef.current?.();
    },
    []
  );

  useLayoutEffect(() => {
    const { documentElement } = document;
    if (lockedLayout === null) {
      delete documentElement.dataset["layoutViewportLocked"];
      documentElement.style.removeProperty(LAYOUT_VIEWPORT_HEIGHT_PROPERTY);
      return;
    }

    documentElement.dataset["layoutViewportLocked"] = "true";
    documentElement.style.setProperty(
      LAYOUT_VIEWPORT_HEIGHT_PROPERTY,
      `${lockedLayout.viewport.layoutHeight}px`
    );
    return () => {
      delete documentElement.dataset["layoutViewportLocked"];
      documentElement.style.removeProperty(LAYOUT_VIEWPORT_HEIGHT_PROPERTY);
    };
  }, [lockedLayout]);

  return {
    acquire,
    isLocked: lockedLayout !== null,
    lockedValue: lockedLayout?.value ?? null,
  };
};
