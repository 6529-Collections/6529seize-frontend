"use client";

import React, { useRef, useState, useEffect } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { AnimatePresence, motion } from "framer-motion";
import { useClickAway, useKeyPressEvent } from "react-use";
import { createPortal } from "react-dom";
import { WaveHeaderPinnedSide } from "./WaveHeader";
import Drop, { DropLocation } from "../drops/Drop";
import { DropSize } from "../../../helpers/waves/drop.helpers";

interface WaveHeaderDescriptionProps {
  readonly wave: ApiWave;
  readonly side: WaveHeaderPinnedSide;
}

// Helper functions to reduce cognitive complexity
const calculatePosition = (
  buttonRect: DOMRect,
  contentHeight: number,
  viewportHeight: number
): { position: "bottom" | "top"; maxHeight: number } => {
  const bottomSpace = viewportHeight - buttonRect.bottom;
  const topSpace = buttonRect.top;
  
  if (bottomSpace >= contentHeight || bottomSpace >= topSpace) {
    return { position: "bottom", maxHeight: bottomSpace - 16 };
  }
  return { position: "top", maxHeight: topSpace - 16 };
};

const getMobilePositionStyles = (
  position: "bottom" | "top",
  buttonRect: DOMRect | undefined
) => {
  if (!buttonRect) return {};
  
  return {
    top: position === "bottom" ? buttonRect.bottom + 8 : undefined,
    bottom: position === "top" ? window.innerHeight - buttonRect.top + 8 : undefined,
    left: 0,
    right: 0,
  };
};

const getDesktopPositionStyles = (
  position: "bottom" | "top",
  buttonRect: DOMRect | undefined,
  side: WaveHeaderPinnedSide
) => {
  if (!buttonRect) return {};
  
  return {
    top: position === "bottom" ? buttonRect.top : undefined,
    bottom: position === "top" ? window.innerHeight - buttonRect.top : undefined,
    left: side === WaveHeaderPinnedSide.RIGHT ? buttonRect.right + 8 : undefined,
    right: side === WaveHeaderPinnedSide.LEFT ? 56 : undefined,
  };
};

const WaveHeaderDescription: React.FC<WaveHeaderDescriptionProps> = ({ wave, side }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const [position, setPosition] = useState<"bottom" | "top">("bottom");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen && portalRef.current) {
      const updatePosition = () => {
        const buttonRect = buttonRef.current?.getBoundingClientRect();
        const dropdownRect = portalRef.current?.getBoundingClientRect();

        if (!buttonRect || !dropdownRect) return;

        const result = calculatePosition(
          buttonRect,
          dropdownRect.height,
          window.innerHeight
        );
        
        setPosition(result.position);
        setMaxHeight(result.maxHeight);
      };

      // Run once after render and add resize listener
      updatePosition();
      window.addEventListener("resize", updatePosition);
      return () => window.removeEventListener("resize", updatePosition);
    }
  }, [isOpen]);

  useClickAway(dropdownRef, () => {
    if (isOpen) setIsOpen(false);
  });

  useKeyPressEvent("Escape", () => {
    if (isOpen) setIsOpen(false);
  });

  return (
    <div ref={dropdownRef} className="tw-relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Show wave description"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="tw-bg-transparent tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-size-8 tw-border-0 tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-ring-1 desktop-hover:hover:tw-ring-iron-700 desktop-hover:hover:tw-ring-inset tw-transition tw-duration-300 tw-ease-out">
        <svg
          className="tw-size-4 tw-flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
          />
        </svg>
      </button>
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={portalRef}
              initial={
                isMobile ? { opacity: 0, y: 10 } : { opacity: 0, x: -10 }
              }
              animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 }}
              exit={isMobile ? { opacity: 0, y: 10 } : { opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "absolute",
                maxHeight: maxHeight,
                overflowY: "auto",
                ...(isMobile
                  ? getMobilePositionStyles(position, buttonRef.current?.getBoundingClientRect())
                  : getDesktopPositionStyles(position, buttonRef.current?.getBoundingClientRect(), side)
                ),
              }}
              className={`tw-z-50 tw-bg-iron-800 tw-p-1 tw-shadow-xl tw-ring-1 tw-ring-iron-800 tw-focus:tw-outline-none tw-space-y-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-transition-colors tw-duration-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden ${
                isMobile
                  ? "tw-w-full tw-rounded-lg"
                  : "lg:tw-max-w-[672px] tw-w-full tw-rounded-lg tw-origin-top-left"
              }`}>
              <Drop
                drop={{
                  type: DropSize.FULL,
                  ...wave.description_drop,
                  stableKey: wave.description_drop.id,
                  stableHash: wave.description_drop.id,
                }}
                showWaveInfo={false}
                activeDrop={null}
                dropViewDropId={null}
                onReplyClick={() => {}}
                showReplyAndQuote={false}
                location={DropLocation.WAVE}
                onReply={() => {}}
                onQuote={() => {}}
                previousDrop={null}
                nextDrop={null}
                onQuoteClick={() => {}}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default WaveHeaderDescription;
