"use client";

import { trapTabFocus } from "@/components/utils/modal/focusTrap";
import { WaveDropCreate } from "@/components/waves/leaderboard/create/WaveDropCreate";
import type { ApiWave } from "@/generated/models/ApiWave";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

interface WaveChatSubmitDropModalProps {
  readonly isOpen: boolean;
  readonly wave: ApiWave;
  readonly title: string;
  readonly onClose: () => void;
  readonly initialCurationUrl?: string | null | undefined;
}

export function WaveChatSubmitDropModal({
  isOpen,
  wave,
  title,
  onClose,
  initialCurationUrl = null,
}: WaveChatSubmitDropModalProps) {
  const canUseDOM = typeof document !== "undefined";
  const titleId = useId();
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
      const panel = panelRef.current;
      if (!panel) {
        return;
      }

      if (event.key !== "Escape" && event.key !== "Tab") {
        return;
      }

      if (event.defaultPrevented) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      trapTabFocus(event, panel);
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

  const closeBackdropLabel = `Close ${title.toLowerCase()} modal`;

  return createPortal(
    <dialog
      open
      aria-modal="true"
      aria-labelledby={titleId}
      className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1000] tw-m-0 tw-h-full tw-w-full tw-max-w-none tw-border-0 tw-bg-gray-600/50 tw-p-0 tw-outline-none tw-backdrop-blur-[1px]"
      data-testid="chat-submit-drop-modal"
    >
      <button
        type="button"
        onClick={onClose}
        className="tw-fixed tw-inset-0 tw-cursor-default tw-border-0 tw-bg-transparent tw-p-0"
        aria-label={closeBackdropLabel}
        tabIndex={-1}
      />
      <LazyMotion features={domAnimation}>
        <div className="tw-relative tw-z-10 tw-flex tw-h-full tw-items-start tw-justify-center tw-px-4 tw-pb-4 tw-pt-[calc(env(safe-area-inset-top,0px)+1rem)] lg:tw-items-center">
          <m.div
            ref={panelRef}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="tw-max-h-[90vh] tw-w-full tw-max-w-3xl tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-shadow-2xl"
            data-testid="chat-submit-drop-modal-panel"
            tabIndex={-1}
          >
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-border-b tw-border-solid tw-border-iron-800 tw-p-6">
              <h2
                id={titleId}
                ref={titleRef}
                className="tw-mb-0 tw-text-2xl tw-font-bold tw-text-white"
                tabIndex={-1}
              >
                {title}
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
                <WaveDropCreate
                  wave={wave}
                  onSuccess={onClose}
                  initialCurationUrl={initialCurationUrl}
                  isModalContent
                />
              </div>
            </div>
          </m.div>
        </div>
      </LazyMotion>
    </dialog>,
    document.body
  );
}
