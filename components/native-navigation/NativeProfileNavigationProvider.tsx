"use client";

import UserPageHeaderClient from "@/components/user/user-page-header/UserPageHeaderClient";
import type { CicStatement } from "@/entities/IProfile";
import { closeAllCustomTooltips } from "@/helpers/tooltip.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useIdentity } from "@/hooks/useIdentity";
import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";
import {
  getNativeProfileHistoryValue,
  getNativeProfileLocation,
  getNativeProfileTarget,
  isNativeProfileOverlaySource,
  NATIVE_PROFILE_STACK_LIMIT,
  withNativeProfileHistoryValue,
  type NativeProfileHistoryValue,
  type NativeProfileLocation,
  type NativeProfileStackEntry,
  type NativeProfileTarget,
} from "./nativeProfileNavigation.helpers";

const EDGE_SWIPE_WIDTH_PX = 36;
const EDGE_SWIPE_CLOSE_DISTANCE_PX = 72;
const EDGE_SWIPE_HORIZONTAL_RATIO = 1.35;
const DEFAULT_BANNER_1 = "#111827";
const DEFAULT_BANNER_2 = "#1f2937";
const EMPTY_STATEMENTS: CicStatement[] = [];
const EMPTY_STACK: readonly NativeProfileStackEntry[] = [];

type SwipeSide = "left" | "right";

type GestureState = {
  readonly side: SwipeSide;
  readonly startX: number;
  readonly startY: number;
};

type TouchPoint = {
  readonly clientX: number;
  readonly clientY: number;
};

type NativeProfileNavigationContextValue = {
  readonly backgroundLocation: NativeProfileLocation | null;
  readonly stack: readonly NativeProfileStackEntry[];
  readonly openProfile: (target: NativeProfileTarget) => void;
  readonly closeTopProfile: () => void;
};

const NativeProfileNavigationContext =
  createContext<NativeProfileNavigationContextValue | null>(null);

const makeProfileEntry = ({
  href,
  user,
}: NativeProfileTarget): NativeProfileStackEntry => ({
  href,
  user,
  id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
});

const getCurrentHistoryValue = (): NativeProfileHistoryValue | null => {
  if (typeof globalThis.window === "undefined") {
    return null;
  }

  return getNativeProfileHistoryValue(globalThis.window.history.state);
};

const shouldIgnoreAnchorClick = (
  event: MouseEvent,
  anchor: HTMLAnchorElement
): boolean =>
  event.defaultPrevented ||
  event.button !== 0 ||
  event.metaKey ||
  event.ctrlKey ||
  event.altKey ||
  event.shiftKey ||
  Boolean(anchor.target && anchor.target !== "_self") ||
  anchor.hasAttribute("download");

export const useNativeProfileNavigation =
  (): NativeProfileNavigationContextValue => {
    const context = useContext(NativeProfileNavigationContext);
    if (context) {
      return context;
    }

    return {
      backgroundLocation: null,
      stack: [],
      openProfile: () => {},
      closeTopProfile: () => {},
    };
  };

export default function NativeProfileNavigationProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { isApp } = useDeviceInfo();
  const [historyValue, setHistoryValue] =
    useState<NativeProfileHistoryValue | null>(null);
  const stack = useMemo(
    () => historyValue?.stack ?? EMPTY_STACK,
    [historyValue]
  );
  const backgroundLocation =
    historyValue && stack.length > 0 ? historyValue.background : null;

  const openProfile = useCallback(
    (target: NativeProfileTarget) => {
      if (!isApp || typeof globalThis.window === "undefined") {
        return;
      }

      const browserWindow = globalThis.window;
      const currentHistoryValue = getCurrentHistoryValue() ?? historyValue;
      const currentStack = currentHistoryValue?.stack ?? [];
      const topEntry = currentStack.at(-1);
      if (topEntry?.href === target.href) {
        return;
      }

      const background =
        currentHistoryValue?.background ??
        getNativeProfileLocation(browserWindow.location);
      const nextValue: NativeProfileHistoryValue = {
        background,
        stack: [...currentStack, makeProfileEntry(target)].slice(
          -NATIVE_PROFILE_STACK_LIMIT
        ),
      };

      browserWindow.history.pushState(
        withNativeProfileHistoryValue(browserWindow.history.state, nextValue),
        "",
        target.href
      );
      setHistoryValue(nextValue);
    },
    [historyValue, isApp]
  );

  const closeTopProfile = useCallback(() => {
    if (typeof globalThis.window === "undefined") {
      setHistoryValue(null);
      return;
    }

    const browserWindow = globalThis.window;
    const currentHistoryValue = getNativeProfileHistoryValue(
      browserWindow.history.state
    );

    if ((currentHistoryValue?.stack.length ?? 0) > 0) {
      browserWindow.history.back();
      return;
    }

    setHistoryValue(null);
  }, []);

  useEffect(() => {
    if (!isApp || typeof globalThis.window === "undefined") {
      return;
    }

    const browserWindow = globalThis.window;
    const handlePopState = (event: PopStateEvent) => {
      setHistoryValue(getNativeProfileHistoryValue(event.state));
    };

    browserWindow.addEventListener("popstate", handlePopState);
    return () => {
      browserWindow.removeEventListener("popstate", handlePopState);
    };
  }, [isApp]);

  useEffect(() => {
    if (!isApp || stack.length === 0 || typeof document === "undefined") {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isApp, stack.length]);

  useEffect(() => {
    if (!isApp || typeof document === "undefined") {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || shouldIgnoreAnchorClick(event, anchor)) {
        return;
      }

      const browserWindow = globalThis.window;

      const hasActiveStack = stack.length > 0;
      if (
        !hasActiveStack &&
        !isNativeProfileOverlaySource(
          browserWindow.location.pathname,
          browserWindow.location.search
        )
      ) {
        return;
      }

      const profileTarget = getNativeProfileTarget({
        href: anchor.href,
        origin: browserWindow.location.origin,
      });
      if (!profileTarget) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      closeAllCustomTooltips();
      openProfile(profileTarget);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [isApp, openProfile, stack.length]);

  const contextValue = useMemo<NativeProfileNavigationContextValue>(
    () => ({
      backgroundLocation,
      stack,
      openProfile,
      closeTopProfile,
    }),
    [backgroundLocation, closeTopProfile, openProfile, stack]
  );

  const topEntry = stack.at(-1) ?? null;

  return (
    <NativeProfileNavigationContext.Provider value={contextValue}>
      {children}
      {isApp && topEntry ? (
        <NativeProfileOverlay
          entry={topEntry}
          isStacked={stack.length > 1}
          onClose={closeTopProfile}
        />
      ) : null}
    </NativeProfileNavigationContext.Provider>
  );
}

function NativeProfileOverlay({
  entry,
  isStacked,
  onClose,
}: {
  readonly entry: NativeProfileStackEntry;
  readonly isStacked: boolean;
  readonly onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDialogElement | null>(null);
  const gestureRef = useRef<GestureState | null>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    overlayRef.current?.focus({ preventScroll: true });
  }, [entry.id]);

  const resetGesture = useCallback(() => {
    gestureRef.current = null;
    setDragX(0);
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      const touch = event.touches[0];
      if (!touch || event.touches.length !== 1) {
        return;
      }

      const viewportWidth = globalThis.innerWidth || 0;
      let side: SwipeSide | null = null;
      if (touch.clientX <= EDGE_SWIPE_WIDTH_PX) {
        side = "left";
      } else if (touch.clientX >= viewportWidth - EDGE_SWIPE_WIDTH_PX) {
        side = "right";
      }

      if (!side) {
        return;
      }

      gestureRef.current = {
        side,
        startX: touch.clientX,
        startY: touch.clientY,
      };
    },
    []
  );

  const getInwardDrag = useCallback((touch: TouchPoint | undefined) => {
    const gesture = gestureRef.current;
    if (!gesture || !touch) {
      return null;
    }

    const deltaX = touch.clientX - gesture.startX;
    const deltaY = touch.clientY - gesture.startY;
    const inwardDistance =
      gesture.side === "left" ? Math.max(deltaX, 0) : Math.max(-deltaX, 0);
    const signedDistance =
      gesture.side === "left" ? inwardDistance : -inwardDistance;

    return {
      deltaY,
      inwardDistance,
      signedDistance,
    };
  }, []);

  const handleTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      const drag = getInwardDrag(event.touches[0]);
      if (!drag) {
        return;
      }

      const absY = Math.abs(drag.deltaY);
      if (
        drag.inwardDistance <= 8 ||
        drag.inwardDistance <= absY * EDGE_SWIPE_HORIZONTAL_RATIO
      ) {
        return;
      }

      event.preventDefault();
      setIsDragging(true);
      setDragX(drag.signedDistance);
    },
    [getInwardDrag]
  );

  const handleTouchEnd = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      const drag = getInwardDrag(event.changedTouches[0]);
      if (!drag) {
        return;
      }

      const shouldClose =
        drag.inwardDistance >= EDGE_SWIPE_CLOSE_DISTANCE_PX &&
        drag.inwardDistance >
          Math.abs(drag.deltaY) * EDGE_SWIPE_HORIZONTAL_RATIO;

      resetGesture();
      if (shouldClose) {
        onClose();
      }
    },
    [getInwardDrag, onClose, resetGesture]
  );

  const contentStyle = useMemo<CSSProperties>(
    () => ({
      transform: dragX === 0 ? undefined : `translate3d(${dragX}px, 0, 0)`,
      transition: isDragging ? "none" : "transform 180ms ease-out",
      touchAction: "pan-y",
    }),
    [dragX, isDragging]
  );

  return (
    <dialog
      aria-label="Profile"
      className="tailwind-scope tw-fixed tw-inset-0 tw-z-[2147483000] tw-m-0 tw-h-auto tw-max-h-none tw-w-auto tw-max-w-none tw-overflow-hidden tw-border-0 tw-bg-black tw-p-0 tw-text-iron-50"
      data-native-profile-overlay={entry.href}
      open
      ref={overlayRef}
      tabIndex={-1}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div
        className="tw-flex tw-h-[100dvh] tw-flex-col tw-bg-black"
        onTouchCancel={resetGesture}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        style={contentStyle}
      >
        <div className="tw-flex tw-min-h-[calc(3.5rem+env(safe-area-inset-top,0px))] tw-items-end tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-black/95 tw-px-3 tw-pb-2 tw-pt-[env(safe-area-inset-top,0px)]">
          <button
            type="button"
            aria-label={isStacked ? "Back" : "Close profile"}
            className="tw-inline-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
            onClick={onClose}
          >
            {isStacked ? (
              <ChevronLeftIcon className="tw-h-6 tw-w-6" />
            ) : (
              <XMarkIcon className="tw-h-6 tw-w-6" />
            )}
          </button>
          <div className="tw-min-w-0 tw-flex-1 tw-px-2 tw-pb-2 tw-text-center tw-text-sm tw-font-semibold tw-text-iron-100">
            Profile
          </div>
          <div aria-hidden="true" className="tw-h-10 tw-w-10" />
        </div>
        <div className="tw-flex-1 tw-overflow-y-auto tw-overscroll-contain">
          <NativeProfileOverlayContent entry={entry} />
        </div>
      </div>
    </dialog>
  );
}

function NativeProfileOverlayContent({
  entry,
}: {
  readonly entry: NativeProfileStackEntry;
}) {
  const { profile, isLoading } = useIdentity({
    handleOrWallet: entry.user,
    initialProfile: null,
  });

  if (isLoading && !profile) {
    return (
      <div className="tw-flex tw-min-h-[50dvh] tw-items-center tw-justify-center">
        <div className="tw-h-8 tw-w-8 tw-animate-spin tw-rounded-full tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="tw-flex tw-min-h-[50dvh] tw-items-center tw-justify-center tw-p-6 tw-text-center tw-text-sm tw-text-iron-300">
        This profile could not be loaded.
      </div>
    );
  }

  const handleOrWallet = (
    profile.handle ?? profile.primary_wallet
  ).toLowerCase();
  const fallbackMainAddress = profile.primary_wallet;

  return (
    <UserPageHeaderClient
      profile={profile}
      handleOrWallet={handleOrWallet}
      fallbackMainAddress={fallbackMainAddress}
      defaultBanner1={DEFAULT_BANNER_1}
      defaultBanner2={DEFAULT_BANNER_2}
      initialStatements={EMPTY_STATEMENTS}
      profileEnabledAt={null}
      followersCount={null}
      cmsWebsiteHref={null}
    />
  );
}
