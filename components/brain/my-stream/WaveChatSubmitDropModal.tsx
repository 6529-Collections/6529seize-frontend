"use client";

import { trapTabFocus } from "@/components/utils/modal/focusTrap";
import useKeyboardFocusScroll from "@/components/waves/create-wave/hooks/useKeyboardFocusScroll";
import { WaveDropCreate } from "@/components/waves/leaderboard/create/WaveDropCreate";
import type { ApiWave } from "@/generated/models/ApiWave";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { useEffect, useId, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";

interface WaveChatSubmitDropModalProps {
  readonly isOpen: boolean;
  readonly wave: ApiWave;
  readonly title: string;
  readonly onClose: () => void;
  readonly initialCurationUrl?: string | null | undefined;
}

const KEYBOARD_INSET = "var(--native-keyboard-inset-bottom, 0px)";
const KEYBOARD_TRANSITION =
  "var(--native-keyboard-layout-transition-duration, 0ms)";
const DIALOG_LAYOUT_STYLE: CSSProperties = {
  height: `max(0px, calc(100% - ${KEYBOARD_INSET}))`,
  transform: `translate3d(0, calc(0px - ${KEYBOARD_INSET}), 0)`,
  transition: `height ${KEYBOARD_TRANSITION} ease-out, transform ${KEYBOARD_TRANSITION} ease-out`,
};

function SubmitDropForm({
  wave,
  onClose,
  initialCurationUrl,
}: Pick<
  WaveChatSubmitDropModalProps,
  "wave" | "onClose" | "initialCurationUrl"
>) {
  const contentRef = useRef<HTMLDivElement>(null);
  useKeyboardFocusScroll(contentRef);

  return (
    <div
      ref={contentRef}
      className="tw-min-h-0 tw-scroll-py-3 tw-overflow-y-auto tw-overscroll-contain tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300"
    >
      <div className="tw-px-4 tw-pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] tw-pt-5 sm:tw-px-6 sm:tw-pb-6">
        <WaveDropCreate
          wave={wave}
          onCancel={onClose}
          onSuccess={onClose}
          onExitFixedDropMode={onClose}
          initialCurationUrl={initialCurationUrl}
          identityPickerPlacement="inline"
          isModalContent
        />
      </div>
    </div>
  );
}

function isEventFromNestedAriaModal(
  event: KeyboardEvent,
  parentDialog: HTMLDialogElement | null
) {
  if (!parentDialog || !(event.target instanceof Element)) {
    return false;
  }

  const nearestAriaModal = event.target.closest('[aria-modal="true"]');
  return nearestAriaModal !== null && nearestAriaModal !== parentDialog;
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
  const dialogRef = useRef<HTMLDialogElement | null>(null);
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

      if (isEventFromNestedAriaModal(event, dialogRef.current)) {
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
      ref={dialogRef}
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
        <div
          className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-z-10 tw-flex tw-items-end tw-justify-center tw-pt-[calc(env(safe-area-inset-top,0px)+1rem)] sm:tw-items-center sm:tw-px-4 sm:tw-pb-4"
          style={DIALOG_LAYOUT_STYLE}
        >
          <m.div
            ref={panelRef}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="tw-flex tw-max-h-full tw-w-full tw-max-w-3xl tw-flex-col tw-overflow-hidden tw-rounded-t-2xl tw-border tw-border-b-0 tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-shadow-2xl sm:tw-max-h-[min(90vh,100%)] sm:tw-rounded-xl sm:tw-border-b"
            data-testid="chat-submit-drop-modal-panel"
            tabIndex={-1}
          >
            <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-p-6">
              <h2
                id={titleId}
                ref={titleRef}
                className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white"
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
                <XMarkIcon className="tw-size-5 tw-flex-shrink-0" />
              </button>
            </div>

            <SubmitDropForm
              wave={wave}
              onClose={onClose}
              initialCurationUrl={initialCurationUrl}
            />
          </m.div>
        </div>
      </LazyMotion>
    </dialog>,
    document.body
  );
}
