"use client";

import React, { useCallback, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import BrainContentInput from "./input/BrainContentInput";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";

type BrainContentStyle = React.CSSProperties & {
  readonly "--brain-content-composer-reserve": string;
};

interface BrainContentProps {
  readonly children: React.ReactNode;
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
}

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
    ? composerHeight + composerBottomOffset
    : 0;
  const composerPositionClassName = isApp
    ? "tw-fixed tw-inset-x-0"
    : "tw-absolute tw-inset-x-0 tw-bottom-0";
  const containerStyle: BrainContentStyle = {
    "--brain-content-composer-reserve": `${composerReserve}px`,
  };
  const composerMotionInitial = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 8 };
  const composerMotionAnimate = shouldReduceMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0 };
  const composerMotionExit = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 6 };
  const composerMotionTransition = {
    duration: shouldReduceMotion ? 0 : 0.18,
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

  return (
    <div
      className="tw-relative tw-flex tw-h-full tw-min-h-0 tw-flex-col"
      style={containerStyle}
    >
      <div className="tw-min-h-0 tw-flex-1 tw-overflow-hidden">
        <div className="tw-h-full tw-min-h-0">{children}</div>
      </div>
      <AnimatePresence initial={false}>
        {activeDrop && (
          <motion.div
            ref={handleComposerRef}
            className={`${composerPositionClassName} tw-z-[80] tw-bg-black tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0`}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrainContent;
