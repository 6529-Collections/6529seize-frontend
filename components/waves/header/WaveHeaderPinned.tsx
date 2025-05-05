import React, { useRef, useState, useEffect } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { AnimatePresence, motion } from "framer-motion";
import { useClickAway, useKeyPressEvent } from "react-use";
import { createPortal } from "react-dom";
import { WaveHeaderPinnedSide } from "./WaveHeader";
import Drop, { DropLocation } from "../drops/Drop";
import { DropSize } from "../../../helpers/waves/drop.helpers";

interface WaveHeaderPinnedProps {
  readonly wave: ApiWave;
  readonly side: WaveHeaderPinnedSide;
}

const WaveHeaderPinned: React.FC<WaveHeaderPinnedProps> = ({ wave, side }) => {
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

        const viewportHeight = window.innerHeight;
        const bottomSpace = viewportHeight - buttonRect.bottom;
        const topSpace = buttonRect.top;
        const contentHeight = dropdownRect.height;

        // Check if content fits below
        if (bottomSpace >= contentHeight || bottomSpace >= topSpace) {
          setPosition("bottom");
          setMaxHeight(bottomSpace - 16); // Subtract padding
        } else {
          setPosition("top");
          setMaxHeight(topSpace - 16); // Subtract padding
        }
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
        className="tw-h-8 tw-w-8 tw-text-iron-400 hover:tw-text-iron-300 tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-iron-800 tw-ring-1 tw-ring-iron-700 hover:tw-ring-iron-650 tw-rounded-lg tw-bg-iron-800 tw-text-sm tw-font-semibold tw-shadow-sm hover:tw-bg-iron-700 hover:tw-border-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          className="tw-size-4 tw-flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.0004 15L12.0004 22M8.00043 7.30813V9.43875C8.00043 9.64677 8.00043 9.75078 7.98001 9.85026C7.9619 9.93852 7.93194 10.0239 7.89095 10.1042C7.84474 10.1946 7.77977 10.2758 7.64982 10.4383L6.08004 12.4005C5.4143 13.2327 5.08143 13.6487 5.08106 13.9989C5.08073 14.3035 5.21919 14.5916 5.4572 14.7815C5.73088 15 6.26373 15 7.32943 15H16.6714C17.7371 15 18.27 15 18.5437 14.7815C18.7817 14.5916 18.9201 14.3035 18.9198 13.9989C18.9194 13.6487 18.5866 13.2327 17.9208 12.4005L16.351 10.4383C16.2211 10.2758 16.1561 10.1946 16.1099 10.1042C16.0689 10.0239 16.039 9.93852 16.0208 9.85026C16.0004 9.75078 16.0004 9.64677 16.0004 9.43875V7.30813C16.0004 7.19301 16.0004 7.13544 16.0069 7.07868C16.0127 7.02825 16.0223 6.97833 16.0357 6.92937C16.0507 6.87424 16.0721 6.8208 16.1149 6.71391L17.1227 4.19423C17.4168 3.45914 17.5638 3.09159 17.5025 2.79655C17.4489 2.53853 17.2956 2.31211 17.0759 2.1665C16.8247 2 16.4289 2 15.6372 2H8.36368C7.57197 2 7.17611 2 6.92494 2.1665C6.70529 2.31211 6.55199 2.53853 6.49838 2.79655C6.43707 3.09159 6.58408 3.45914 6.87812 4.19423L7.88599 6.71391C7.92875 6.8208 7.95013 6.87424 7.96517 6.92937C7.97853 6.97833 7.98814 7.02825 7.99392 7.07868C8.00043 7.13544 8.00043 7.19301 8.00043 7.30813Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
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
                  ? {
                      top:
                        position === "bottom"
                          ? (buttonRef.current?.getBoundingClientRect()
                              .bottom ?? 0) + 8
                          : undefined,
                      bottom:
                        position === "top"
                          ? window.innerHeight -
                            (buttonRef.current?.getBoundingClientRect().top ??
                              0) +
                            8
                          : undefined,
                      left: 0,
                      right: 0,
                    }
                  : {
                      top:
                        position === "bottom"
                          ? buttonRef.current?.getBoundingClientRect().top ?? 0
                          : undefined,
                      bottom:
                        position === "top"
                          ? window.innerHeight -
                            (buttonRef.current?.getBoundingClientRect().top ??
                              0)
                          : undefined,
                      left:
                        side === WaveHeaderPinnedSide.RIGHT
                          ? (buttonRef.current?.getBoundingClientRect().right ??
                              0) + 8
                          : undefined,
                      right:
                        side === WaveHeaderPinnedSide.LEFT ? 56 : undefined,
                    }),
              }}
              className={`tw-z-50 tw-bg-iron-800 tw-p-1 tw-shadow-xl tw-ring-1 tw-ring-iron-800 tw-focus:tw-outline-none tw-space-y-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-transition-colors tw-duration-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden ${
                isMobile
                  ? "tw-w-full tw-rounded-lg"
                  : "lg:tw-max-w-[672px] tw-w-full tw-rounded-lg tw-origin-top-left"
              }`}
            >
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

export default WaveHeaderPinned;
