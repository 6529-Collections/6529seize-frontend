"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface DelegationToastState {
  title: string;
  message?: ReactNode;
}

function closeDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.close === "function" && dialog.open) {
    dialog.close();
    return;
  }

  dialog.removeAttribute("open");
}

export function useDelegationToast() {
  const toastRef = useRef<HTMLDialogElement>(null);
  const [toast, setToast] = useState<DelegationToastState | undefined>(
    undefined
  );
  const [showToast, setShowToast] = useState(false);

  const showDelegationToast = useCallback((nextToast: DelegationToastState) => {
    setToast(nextToast);
    setShowToast(true);
  }, []);

  const clearDelegationToast = useCallback(() => {
    setShowToast(false);
    setToast(undefined);
  }, []);

  const setToastVisibility = useCallback((show: boolean) => {
    setShowToast(show);
    if (!show) {
      setToast(undefined);
    }
  }, []);

  return {
    toastRef,
    toast,
    showToast,
    showDelegationToast,
    clearDelegationToast,
    setToastVisibility,
  };
}

export function DelegationToast(
  props: Readonly<{
    toastRef: React.RefObject<HTMLDialogElement | null>;
    toast: DelegationToastState;
    showToast: boolean;
    setShowToast: (show: boolean) => void;
  }>
) {
  const { toastRef, toast, showToast, setShowToast } = props;
  const { title, message } = toast;
  const hasMessage = Boolean(message);
  const titleId = useId();
  const messageId = useId();
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!showToast || typeof document === "undefined") {
      return undefined;
    }

    const dialog = toastRef.current;
    if (!dialog) {
      return undefined;
    }

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      dialog.setAttribute("open", "");
    }

    dialog.querySelector<HTMLElement>('button[aria-label^="Dismiss"]')?.focus();

    return () => {
      closeDialog(dialog);
      previouslyFocusedElementRef.current?.focus();
      previouslyFocusedElementRef.current = null;
    };
  }, [showToast, toastRef]);

  if (!showToast || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <dialog
      ref={toastRef}
      aria-describedby={hasMessage ? messageId : undefined}
      aria-labelledby={titleId}
      aria-modal="true"
      className="tailwind-scope tw-fixed tw-inset-0 tw-m-0 tw-h-[100dvh] tw-max-h-none tw-w-screen tw-max-w-none tw-border-0 tw-bg-transparent tw-p-0 tw-text-black backdrop:tw-bg-transparent"
      onCancel={(event) => {
        event.preventDefault();
        setShowToast(false);
      }}
    >
      <button
        type="button"
        aria-label="Close notification backdrop"
        className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-border-0 tw-bg-black/60 tw-p-0"
        onClick={() => setShowToast(false)}
        tabIndex={-1}
      />
      <div className="tw-relative tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-p-4">
        <div
          className="tw-relative tw-z-[101] tw-w-full tw-max-w-[420px] tw-overflow-hidden tw-rounded-xl tw-bg-white tw-text-black tw-shadow-2xl"
          role="status"
          aria-live="polite"
        >
          <div className="tw-flex tw-items-center tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-black/10 tw-px-3 tw-py-2">
            <h2 id={titleId} className="tw-m-0 tw-mr-auto tw-font-semibold">
              {title}
            </h2>
            <button
              type="button"
              aria-label="Dismiss delegation notification"
              className="tw-border-0 tw-bg-transparent tw-p-1 tw-text-2xl tw-leading-none tw-text-black/60 hover:tw-text-black focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              onClick={() => setShowToast(false)}
            >
              &times;
            </button>
          </div>
          {hasMessage && (
            <div
              id={messageId}
              className="tw-px-4 tw-py-4 [&_a]:tw-font-semibold [&_a]:tw-text-black [&_a]:tw-underline"
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </dialog>,
    document.body
  );
}
