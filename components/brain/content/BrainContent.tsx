"use client";

import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
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

const MIN_REPLY_COMPOSER_RESERVE_PX = 104;

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
  const composerMotionInitial = shouldReduceMotion
    ? { opacity: 1, y: "0%" }
    : { opacity: 1, y: "100%" };
  const composerMotionAnimate = { opacity: 1, y: "0%" };
  const composerMotionExit = shouldReduceMotion
    ? { opacity: 1, y: "0%" }
    : { opacity: 1, y: "100%" };
  const containerStyle: BrainContentStyle = {
    "--brain-content-composer-reserve": `${composerReserve}px`,
  };
  const composerMotionTransition = {
    duration: shouldReduceMotion ? 0 : 0.32,
    ease: "easeOut",
  };
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

    return registerWaveComposerDock(composerElement);
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
        <AnimatePresence>
          {activeDrop && (
            <m.div
              ref={handleComposerRef}
              className={`${composerPositionClassName} tw-z-[80] tw-transform-gpu tw-bg-black tw-px-2 tw-will-change-transform sm:tw-px-4 md:tw-px-6 lg:tw-px-0`}
              {...(isApp ? { style: { bottom: composerBottomOffset } } : {})}
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
