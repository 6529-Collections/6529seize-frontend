"use client";

import { useAuth } from "@/components/auth/Auth";
import FontAwesomeSvgIcon from "@/components/common/icons/FontAwesomeSvgIcon";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { useSidebarWavePin } from "@/hooks/useSidebarWavePin";
import {
  resistedWavePinDistance,
  useWaveRowTouchGestures,
  WAVE_PIN_SWIPE_THRESHOLD,
} from "@/hooks/useWaveRowTouchGestures";
import {
  faThumbtack,
  faThumbtackSlash,
} from "@fortawesome/free-solid-svg-icons";
import { animate, motion, useMotionValue } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

// Material Standard spatial spring, damping ratio 0.9 (mass 1).
const ROW_SPRING = { type: "spring", stiffness: 500, damping: 40.25 } as const;
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

function TouchActions({ waveId, isPinned, children }: Omit<Props, "enabled">) {
  const { connectedProfile } = useAuth();
  const { canManage, isProcessing, togglePin } = useSidebarWavePin(
    waveId,
    isPinned
  );
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion
  );
  const rowRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const hintOpacity = useMotionValue(0);
  const hintScale = useMotionValue(0.5);
  const [armed, setArmed] = useState(false);
  const settle = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    if (!reducedMotion) return;
    settle.current?.stop();
    x.set(0);
    hintScale.set(1);
  }, [reducedMotion, x, hintScale]);

  useEffect(() => () => settle.current?.stop(), []);

  useWaveRowTouchGestures({
    enabled: canManage && !isProcessing,
    scope: `${waveId}:${connectedProfile?.id ?? "anonymous"}`,
    rowRef,
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

  const icon = isPinned ? faThumbtackSlash : faThumbtack;

  return (
    <div
      ref={rowRef}
      data-testid="wave-list-touch-row"
      data-wave-touch-row={waveId}
      data-pin-armed={armed}
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
        className="tw-relative tw-bg-[var(--wave-sidebar-background,#000)]"
      >
        {children}
      </motion.div>
    </div>
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
