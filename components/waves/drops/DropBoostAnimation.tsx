"use client";

import BoostIcon from "@/components/common/icons/BoostIcon";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface BoostAnimationState {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly type: "boost" | "unboost";
}

interface DropBoostAnimationProps {
  readonly animation: BoostAnimationState | null;
  readonly onComplete: () => void;
}

const SmokeIcon: React.FC<{ readonly className?: string }> = ({
  className,
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 4C10.3431 4 9 5.34315 9 7C9 7.55228 9.44772 8 10 8C10.5523 8 11 7.55228 11 7C11 6.44772 11.4477 6 12 6C12.5523 6 13 6.44772 13 7C13 7.55228 13.4477 8 14 8C14.5523 8 15 7.55228 15 7C15 5.34315 13.6569 4 12 4Z"
      opacity="0.6"
    />
    <path
      d="M8 12C8 10.3431 9.34315 9 11 9C11.5523 9 12 9.44772 12 10C12 10.5523 11.5523 11 11 11C10.4477 11 10 11.4477 10 12C10 12.5523 10.4477 13 11 13H13C13.5523 13 14 12.5523 14 12C14 11.4477 14.4477 11 15 11C15.5523 11 16 11.4477 16 12C16 13.6569 14.6569 15 13 15H11C9.34315 15 8 13.6569 8 12Z"
      opacity="0.4"
    />
    <path
      d="M6 18C6 16.3431 7.34315 15 9 15C9.55228 15 10 15.4477 10 16C10 16.5523 9.55228 17 9 17C8.44772 17 8 17.4477 8 18C8 18.5523 8.44772 19 9 19H15C15.5523 19 16 18.5523 16 18C16 17.4477 16.4477 17 17 17C17.5523 17 18 17.4477 18 18C18 19.6569 16.6569 21 15 21H9C7.34315 21 6 19.6569 6 18Z"
      opacity="0.3"
    />
  </svg>
);

const DropBoostAnimation: React.FC<DropBoostAnimationProps> = ({
  animation,
  onComplete,
}) => {
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timeoutId = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (animation && shouldReduceMotion) {
      onComplete();
    }
  }, [animation, shouldReduceMotion, onComplete]);

  // If motion is disabled or component not mounted or no animation, skip rendering and call onComplete
  if (shouldReduceMotion || !mounted || !animation) {
    return null;
  }

  const isBoost = animation.type === "boost";

  return createPortal(
    <AnimatePresence mode="wait" onExitComplete={onComplete}>
      {animation && (
        <motion.div
          key={animation.id}
          className="tw-pointer-events-none tw-fixed tw-z-[9999]"
          style={{
            left: animation.x,
            top: animation.y,
            transform: "translate(-50%, -50%)",
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, isBoost ? 1.5 : 0.8],
            y: isBoost ? [0, -20] : [0, -30],
          }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            duration: isBoost ? 0.6 : 0.5,
            ease: "easeOut",
            times: [0, 0.3, 0.6, 1],
          }}
        >
          {isBoost ? (
            <>
              {/* Glow effect */}
              <motion.div
                className="tw-absolute tw-inset-0 tw-rounded-full tw-blur-xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,140,0,0.6) 0%, rgba(255,69,0,0.3) 50%, transparent 70%)",
                  width: "80px",
                  height: "80px",
                  left: "-40px",
                  top: "-40px",
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.5, 2] }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
              {/* Flame icon */}
              <BoostIcon
                className="tw-size-12 tw-text-orange-500 tw-drop-shadow-[0_0_8px_rgba(255,140,0,0.8)]"
                variant="animated"
              />
            </>
          ) : (
            <>
              {/* Smoke effect for unboost */}
              <motion.div
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <SmokeIcon className="tw-size-10 tw-text-iron-400" />
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default DropBoostAnimation;
export type { BoostAnimationState };
