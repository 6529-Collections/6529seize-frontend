"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { WaveDropCreate } from "./WaveDropCreate";

interface WaveLeaderboardCurationDropModalProps {
  readonly isOpen: boolean;
  readonly wave: ApiWave;
  readonly onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1']),[contenteditable='true']";

const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((element) => {
    if (!element.isConnected) {
      return false;
    }

    if (element.getAttribute("aria-hidden") === "true") {
      return false;
    }

    if (element instanceof HTMLInputElement && element.type === "hidden") {
      return false;
    }

    return !element.hasAttribute("disabled");
  });

export function WaveLeaderboardCurationDropModal({
  isOpen,
  wave,
  onClose,
}: WaveLeaderboardCurationDropModalProps) {
  const canUseDOM = typeof document !== "undefined";
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const onCloseRef = useRef(onClose);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const activeElement = document.activeElement;
    previouslyFocusedElementRef.current =
      activeElement instanceof HTMLElement ? activeElement : null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusInitialTarget = () => {
      const initialTarget =
        closeButtonRef.current ?? titleRef.current ?? panelRef.current;
      initialTarget?.focus();
    };
    focusInitialTarget();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const panel = panelRef.current;
      if (!panel) {
        return;
      }

      const focusableElements = getFocusableElements(panel);
      if (focusableElements.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement =
        focusableElements[focusableElements.length - 1];
      if (!firstFocusableElement || !lastFocusableElement) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const activeFocusableElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

      if (activeFocusableElement === panel) {
        event.preventDefault();
        if (event.shiftKey) {
          lastFocusableElement.focus();
        } else {
          firstFocusableElement.focus();
        }
        return;
      }

      if (!activeFocusableElement || !panel.contains(activeFocusableElement)) {
        event.preventDefault();
        if (event.shiftKey) {
          lastFocusableElement.focus();
        } else {
          firstFocusableElement.focus();
        }
        return;
      }

      if (event.shiftKey && activeFocusableElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement.focus();
        return;
      }

      if (!event.shiftKey && activeFocusableElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);

      const previouslyFocusedElement = previouslyFocusedElementRef.current;
      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus();
      }
      previouslyFocusedElementRef.current = null;
    };
  }, [isOpen]);

  if (!canUseDOM || !isOpen) {
    return null;
  }

  return createPortal(
    <dialog
      open
      aria-modal="true"
      aria-labelledby="leaderboard-drop-art-title"
      className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1000] tw-m-0 tw-h-full tw-w-full tw-max-w-none tw-border-0 tw-bg-gray-600/50 tw-p-0 tw-outline-none tw-backdrop-blur-[1px]"
      data-testid="curation-drop-modal"
    >
      <button
        type="button"
        onClick={onClose}
        className="tw-fixed tw-inset-0 tw-cursor-default tw-border-0 tw-bg-transparent tw-p-0"
        aria-label="Close drop artwork modal"
        tabIndex={-1}
      />
      <div className="tw-relative tw-z-10 tw-flex tw-h-full tw-items-start tw-justify-center tw-px-4 tw-pb-4 tw-pt-[calc(env(safe-area-inset-top,0px)+1rem)] lg:tw-items-center">
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="tw-max-h-[90vh] tw-w-full tw-max-w-3xl tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-shadow-2xl"
          data-testid="curation-drop-modal-panel"
          tabIndex={-1}
        >
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-border-b tw-border-solid tw-border-iron-800 tw-p-6">
            <h2
              id="leaderboard-drop-art-title"
              ref={titleRef}
              className="tw-mb-0 tw-text-2xl tw-font-bold tw-text-white"
              tabIndex={-1}
            >
              Drop Artwork
            </h2>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-100"
              aria-label="Close modal"
            >
              <XMarkIcon className="tw-size-6 tw-flex-shrink-0" />
            </button>
          </div>

          <div className="tw-max-h-[calc(90vh-88px)] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300">
            <div className="tw-px-6 tw-pb-6 tw-pt-5">
              <p className="tw-mb-5 tw-max-w-lg tw-text-base tw-text-iron-400">
                Enter a supported curation URL to submit a new piece to the
                leaderboard.
              </p>
              <WaveDropCreate
                wave={wave}
                onSuccess={onClose}
                isCurationLeaderboard
              />
            </div>
          </div>
        </motion.div>
      </div>
    </dialog>,
    document.body
  );
}
