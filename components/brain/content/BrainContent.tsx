"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from "framer-motion";
import BrainContentInput from "./input/BrainContentInput";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";
import { registerWaveComposerDock } from "@/components/waves/WaveComposerDockVisibility";

type BrainContentStyle = React.CSSProperties & {
  readonly "--brain-content-composer-reserve": string;
};

interface BrainContentProps {
  readonly children: React.ReactNode;
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
}

// Reserve the compact one-line composer height before ResizeObserver runs.
const MIN_REPLY_COMPOSER_RESERVE_PX = 104;
const NATIVE_KEYBOARD_INSET = "var(--native-keyboard-inset-bottom, 0px)";
const NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION =
  "var(--native-keyboard-layout-transition-duration, 0ms)";

const BrainContent: React.FC<BrainContentProps> = ({
  children,
  activeDrop,
  onCancelReplyQuote,
}) => {
  const { isApp } = useDeviceInfo();
  const { spaces } = useLayout();
  const { isVisible: isKeyboardVisible } = useNativeKeyboard();
  const shouldReduceMotion = useReducedMotion();
  const [composerElement, setComposerElement] = useState<HTMLDivElement | null>(
    null
  );
  const [composerHeight, setComposerHeight] = useState(0);
  const composerBottomOffset =
    isApp && activeDrop && !isKeyboardVisible ? spaces.mobileNavSpace : 0;
  const composerReserve = activeDrop
    ? Math.max(composerHeight, MIN_REPLY_COMPOSER_RESERVE_PX) +
      composerBottomOffset
    : 0;
  const composerPositionClassName = isApp
    ? "tw-fixed tw-inset-x-0"
    : "tw-absolute tw-inset-x-0 tw-bottom-0";
  const shouldAnimateComposerEntrance = !isApp && !shouldReduceMotion;
  const composerMotionInitial = shouldAnimateComposerEntrance
    ? { opacity: 1, y: "100%" }
    : { opacity: 1, y: "0%" };
  const composerMotionAnimate = { opacity: 1, y: "0%" };
  const composerMotionExit = shouldAnimateComposerEntrance
    ? { opacity: 1, y: "100%" }
    : { opacity: 1, y: "0%" };
  const containerStyle: BrainContentStyle = {
    "--brain-content-composer-reserve": `${composerReserve}px`,
  };
  const composerMotionTransition = {
    duration: shouldAnimateComposerEntrance ? 0.24 : 0,
    ease: "easeOut",
  };
  const composerStyle = isApp
    ? {
        bottom: `calc(${NATIVE_KEYBOARD_INSET} + ${composerBottomOffset}px)`,
        transitionProperty: "bottom",
        transitionDuration: NATIVE_KEYBOARD_LAYOUT_TRANSITION_DURATION,
        transitionTimingFunction: "ease-out",
      }
    : undefined;
  const handleComposerRef = useCallback((node: HTMLDivElement | null) => {
    setComposerElement(node);
    if (!node) {
      setComposerHeight(0);
    }
  }, []);

  useLayoutEffect(() => {
    if (!composerElement) {
      return;
    }

    const updateComposerHeight = () => {
      setComposerHeight(composerElement.getBoundingClientRect().height);
    };

    updateComposerHeight();

    const resizeObserver = new ResizeObserver(updateComposerHeight);
    resizeObserver.observe(composerElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [composerElement]);

  useEffect(() => {
    if (!composerElement) {
      return;
    }

    const unregister = registerWaveComposerDock(composerElement);
    return typeof unregister === "function" ? unregister : undefined;
  }, [composerElement]);

  return (
    <div
      className="tw-relative tw-flex tw-h-full tw-min-h-0 tw-flex-col"
      style={containerStyle}
    >
      <div className="tw-min-h-0 tw-flex-1 tw-overflow-hidden">
        <div className="tw-h-full tw-min-h-0">{children}</div>
      </div>
      <LazyMotion features={domAnimation}>
        <AnimatePresence initial={false}>
          {activeDrop && (
            <m.div
              ref={handleComposerRef}
              className={`${composerPositionClassName} tw-z-[80] tw-transform-gpu tw-bg-black tw-px-2 tw-will-change-transform sm:tw-px-4 md:tw-px-6 lg:tw-px-0`}
              {...(composerStyle ? { style: composerStyle } : {})}
              initial={composerMotionInitial}
              animate={composerMotionAnimate}
              exit={composerMotionExit}
              transition={composerMotionTransition}
            >
              <BrainContentInput
                activeDrop={activeDrop}
                onCancelReplyQuote={onCancelReplyQuote}
              />
            </m.div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </div>
  );
};

export default BrainContent;
