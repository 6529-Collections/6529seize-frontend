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
  readonly layoutWidth: number;
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

const getViewportGeometry = (): ViewportGeometry => {
  if (typeof window === "undefined") {
    return { layoutHeight: 0, layoutWidth: 0, visualHeight: null };
  }

  return {
    layoutHeight: window.innerHeight,
    layoutWidth: window.innerWidth,
    visualHeight: window.visualViewport?.height ?? null,
  };
};

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

const useViewportOrientationRefresh = ({
  isLocked,
  onRefresh,
}: {
  readonly isLocked: boolean;
  readonly onRefresh: () => void;
}) => {
  useEffect(() => {
    if (!isLocked) return;

    let firstFrame: number | null = null;
    let secondFrame: number | null = null;
    const refreshAfterOrientationChange = () => {
      if (firstFrame !== null) window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== null) window.cancelAnimationFrame(secondFrame);
      firstFrame = window.requestAnimationFrame(() => {
        firstFrame = null;
        secondFrame = window.requestAnimationFrame(() => {
          secondFrame = null;
          onRefresh();
        });
      });
    };

    window.addEventListener("resize", refreshAfterOrientationChange, {
      passive: true,
    });
    window.addEventListener(
      "orientationchange",
      refreshAfterOrientationChange,
      { passive: true }
    );

    return () => {
      if (firstFrame !== null) window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== null) window.cancelAnimationFrame(secondFrame);
      window.removeEventListener("resize", refreshAfterOrientationChange);
      window.removeEventListener(
        "orientationchange",
        refreshAfterOrientationChange
      );
    };
  }, [isLocked, onRefresh]);
};

export const useViewportLayoutLock = <T>(
  value: T,
  isReleaseBlocked: boolean
) => {
  const valueRef = useRef(value);
  const [lockedLayout, setLockedLayout] = useState<LockedLayout<T> | null>(
    null
  );
  const lockedLayoutRef = useRef<LockedLayout<T> | null>(null);
  const lockCountRef = useRef(0);
  const releaseBlockedRef = useRef(isReleaseBlocked);
  const releaseRequestedRef = useRef(false);
  const pendingUnlockRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);

  const unlock = useCallback(() => {
    pendingUnlockRef.current?.();
    pendingUnlockRef.current = null;
    releaseRequestedRef.current = false;
    lockedLayoutRef.current = null;
    setLockedLayout(null);
  }, []);

  const attemptUnlock = useCallback(() => {
    const snapshot = lockedLayoutRef.current;
    if (
      !releaseRequestedRef.current ||
      lockCountRef.current > 0 ||
      releaseBlockedRef.current ||
      snapshot === null
    ) {
      return;
    }

    if (hasViewportRestored(snapshot.viewport)) {
      unlock();
      return;
    }

    if (pendingUnlockRef.current !== null) return;
    pendingUnlockRef.current = waitForViewportRestore(
      snapshot.viewport,
      () => {
        pendingUnlockRef.current = null;
        if (
          releaseRequestedRef.current &&
          lockCountRef.current === 0 &&
          !releaseBlockedRef.current
        ) {
          unlock();
        }
      }
    );
  }, [unlock]);

  useLayoutEffect(() => {
    releaseBlockedRef.current = isReleaseBlocked;
    if (!isReleaseBlocked) attemptUnlock();
  }, [attemptUnlock, isReleaseBlocked]);

  const isLocked = lockedLayout !== null;
  const refreshLockedLayout = useCallback(() => {
    const currentSnapshot = lockedLayoutRef.current;
    if (currentSnapshot === null) return;

    const currentViewport = getViewportGeometry();
    if (
      currentViewport.layoutWidth === currentSnapshot.viewport.layoutWidth
    ) {
      return;
    }

    const nextSnapshot = {
      value: valueRef.current,
      viewport: currentViewport,
    };
    pendingUnlockRef.current?.();
    pendingUnlockRef.current = null;
    lockedLayoutRef.current = nextSnapshot;
    setLockedLayout(nextSnapshot);
    attemptUnlock();
  }, [attemptUnlock]);

  useViewportOrientationRefresh({
    isLocked,
    onRefresh: refreshLockedLayout,
  });

  const acquire = useCallback(() => {
    pendingUnlockRef.current?.();
    pendingUnlockRef.current = null;
    releaseRequestedRef.current = false;
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

      releaseRequestedRef.current = true;
      attemptUnlock();
    };
  }, [attemptUnlock]);

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
