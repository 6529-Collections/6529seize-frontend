"use client";

import "@/i18n/namespaces/wave-sidebar";
import { useAuth } from "@/components/auth/Auth";
import FontAwesomeSvgIcon from "@/components/common/icons/FontAwesomeSvgIcon";
import { MOBILE_BOTTOM_NAV_DOCK_SELECTOR } from "@/helpers/navigation.helpers";
import { useAndroidBackLayer } from "@/hooks/useAndroidBackLayer";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { useSidebarWavePin } from "@/hooks/useSidebarWavePin";
import {
  resistedWavePinDistance,
  useWaveRowTouchGestures,
  WAVE_PIN_SWIPE_THRESHOLD,
} from "@/hooks/useWaveRowTouchGestures";
import { t } from "@/i18n/messages";
import {
  faThumbtack,
  faThumbtackSlash,
} from "@fortawesome/free-solid-svg-icons";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { animate, motion, useMotionValue } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

// Material Standard spatial spring, damping ratio 0.9 (mass 1).
const ROW_SPRING = { type: "spring", stiffness: 500, damping: 40.25 } as const;
const MENU_HEIGHT = 46;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const getReducedMotion = () =>
  globalThis.matchMedia(REDUCED_MOTION_QUERY).matches;
const getServerReducedMotion = () => false;
function subscribeReducedMotion(onChange: () => void) {
  const media = globalThis.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

interface Props {
  readonly enabled: boolean;
  readonly waveId: string;
  readonly isPinned: boolean;
  readonly children: ReactNode;
}

interface MenuPosition {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly cutout: string;
}

function getMenuPosition(row: DOMRect, reducedMotion: boolean): MenuPosition {
  const viewport = globalThis.visualViewport;
  const top = (viewport?.offsetTop ?? 0) + 12;
  const left = (viewport?.offsetLeft ?? 0) + 12;
  const right = left + (viewport?.width ?? globalThis.innerWidth) - 24;
  let bottom =
    (viewport?.offsetTop ?? 0) +
    (viewport?.height ?? globalThis.innerHeight) -
    12;
  document.querySelectorAll(MOBILE_BOTTOM_NAV_DOCK_SELECTOR).forEach((dock) => {
    const bounds = dock.getBoundingClientRect();
    if (bounds.height > 0 && bounds.top > top && bounds.top < bottom)
      bottom = bounds.top - 12;
  });
  const width = Math.min(220, right - left);
  const below = row.bottom + 8;
  const menuTop =
    below + MENU_HEIGHT <= bottom ? below : row.top - 8 - MENU_HEIGHT;
  const liftX = reducedMotion ? 0 : row.width * 0.01;
  const liftY = reducedMotion ? 0 : row.height * 0.01;
  const x1 = row.left - liftX;
  const y1 = row.top - liftY;
  const x2 = row.right + liftX;
  const y2 = row.bottom + liftY;
  return {
    top: Math.max(top, Math.min(menuTop, bottom - MENU_HEIGHT)),
    left: Math.max(left, Math.min(row.left + 12, right - width)),
    width,
    cutout: `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x1}px ${y1}px, ${x1}px ${y2}px, ${x2}px ${y2}px, ${x2}px ${y1}px, ${x1}px ${y1}px)`,
  };
}

function TouchActions({ waveId, isPinned, children }: Omit<Props, "enabled">) {
  const { connectedProfile } = useAuth();
  const { canManage, isProcessing, togglePin } = useSidebarWavePin(
    waveId,
    isPinned
  );
  const locale = useBrowserLocale();
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion
  );
  const rowRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const hintOpacity = useMotionValue(0);
  const hintScale = useMotionValue(0.5);
  const [armed, setArmed] = useState(false);
  const [menu, setMenu] = useState<MenuPosition | null>(null);
  const settle = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    if (!reducedMotion) return;
    settle.current?.stop();
    x.set(0);
    hintScale.set(1);
  }, [reducedMotion, x, hintScale]);

  const closeMenu = useCallback(() => setMenu(null), []);
  useAndroidBackLayer(menu !== null, panelRef, closeMenu);
  useEffect(() => () => settle.current?.stop(), []);
  useEffect(() => {
    if (!menu) return;
    globalThis.addEventListener("resize", closeMenu);
    globalThis.visualViewport?.addEventListener("resize", closeMenu);
    return () => {
      globalThis.removeEventListener("resize", closeMenu);
      globalThis.visualViewport?.removeEventListener("resize", closeMenu);
    };
  }, [menu, closeMenu]);

  useWaveRowTouchGestures({
    enabled: canManage && !isProcessing && menu === null,
    scope: `${waveId}:${connectedProfile?.id ?? "anonymous"}`,
    rowRef,
    onLongPress: () => {
      const row = rowRef.current;
      if (row)
        setMenu(getMenuPosition(row.getBoundingClientRect(), reducedMotion));
    },
    onTogglePin: () => {
      void togglePin();
    },
    onSwipe: (distance, releasing) => {
      settle.current?.stop();
      setArmed(!releasing && distance >= WAVE_PIN_SWIPE_THRESHOLD);
      const progress = Math.min(1, distance / WAVE_PIN_SWIPE_THRESHOLD);
      if (releasing) {
        if (reducedMotion) x.set(0);
        else settle.current = animate(x, 0, ROW_SPRING);
        void animate(hintOpacity, 0, { duration: 0.15 });
      } else {
        x.set(reducedMotion ? 0 : resistedWavePinDistance(distance));
        hintOpacity.set(progress);
        hintScale.set(reducedMotion ? 1 : 0.5 + progress * 0.5);
      }
    },
  });

  const label = t(
    locale,
    isPinned
      ? "waves.sidebar.pinControl.unpinAriaLabel"
      : "waves.sidebar.pinControl.pinAriaLabel"
  );
  const icon = isPinned ? faThumbtackSlash : faThumbtack;

  return (
    <>
      <div
        ref={rowRef}
        data-testid="wave-list-touch-row"
        data-wave-touch-row={waveId}
        data-pin-armed={armed}
        data-wave-menu-open={menu !== null}
        className="tw-relative tw-touch-pan-y tw-select-none [-webkit-touch-callout:none] [&_a]:tw-touch-pan-y [&_a]:tw-select-none [&_a]:[-webkit-touch-callout:none]"
      >
        <motion.span
          aria-hidden="true"
          style={{ opacity: hintOpacity, scale: hintScale }}
          className={`tw-pointer-events-none tw-absolute tw-left-3 tw-top-1/2 -tw-mt-[18px] tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 ${armed ? "tw-text-white" : "tw-text-iron-500"}`}
        >
          <FontAwesomeSvgIcon icon={icon} className="tw-size-4" />
        </motion.span>
        <motion.div
          style={{ x }}
          animate={{ scale: menu && !reducedMotion ? 1.02 : 1 }}
          transition={reducedMotion ? { duration: 0 } : ROW_SPRING}
          className={
            menu
              ? "tw-relative tw-rounded-xl tw-bg-iron-900 tw-shadow-lg [&>div]:tw-rounded-xl"
              : "tw-relative tw-bg-[var(--wave-sidebar-background,#000)]"
          }
        >
          {children}
        </motion.div>
      </div>
      <Dialog
        open={menu !== null}
        onClose={closeMenu}
        aria-label={label}
        className="tailwind-scope tw-relative tw-z-[1100]"
      >
        {menu && (
          <>
            <DialogBackdrop
              transition
              className="tw-fixed tw-inset-0 tw-bg-iron-950/70 tw-transition-opacity tw-duration-150 data-[closed]:tw-opacity-0"
              style={{ clipPath: menu.cutout }}
            />
            <DialogPanel
              ref={panelRef}
              transition
              aria-label={label}
              style={{ top: menu.top, left: menu.left, width: menu.width }}
              className="tw-fixed tw-overflow-hidden tw-rounded-xl tw-bg-iron-800 tw-shadow-xl tw-transition-opacity tw-duration-150 data-[closed]:tw-opacity-0"
            >
              <button
                type="button"
                data-autofocus
                disabled={isProcessing}
                onClick={() => {
                  closeMenu();
                  void togglePin();
                }}
                className="tw-flex tw-min-h-[46px] tw-w-full tw-items-center tw-justify-between tw-gap-4 tw-border-0 tw-bg-transparent tw-px-4 tw-py-2 tw-text-left tw-text-sm tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 disabled:tw-opacity-50"
              >
                <span>{label}</span>
                <FontAwesomeSvgIcon
                  icon={icon}
                  className="tw-size-4 tw-shrink-0"
                />
              </button>
            </DialogPanel>
          </>
        )}
      </Dialog>
    </>
  );
}

function AuthorizedTouchActions(props: Omit<Props, "enabled">) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  if (!connectedProfile?.handle || activeProfileProxy) {
    return props.children;
  }
  return <TouchActions {...props} />;
}

export function SidebarWaveTouchActions({ enabled, ...props }: Props) {
  const isTouchDevice = useIsTouchDevice();
  if (!enabled || !isTouchDevice) return props.children;
  return <AuthorizedTouchActions {...props} />;
}
