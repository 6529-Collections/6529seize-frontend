"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface DelegationToastState {
  title: string;
  message?: ReactNode;
}

export function useDelegationToast() {
  const toastRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<DelegationToastState | undefined>(
    undefined
  );
  const [showToast, setShowToast] = useState(false);

  const showDelegationToast = useCallback((nextToast: DelegationToastState) => {
    setToast(nextToast);
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

  useEffect(() => {
    if (toast) {
      setShowToast(true);
    }
  }, [toast]);

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
    toastRef: React.RefObject<HTMLDivElement | null>;
    toast: DelegationToastState;
    showToast: boolean;
    setShowToast: (show: boolean) => void;
  }>
) {
  const { toastRef, toast, showToast, setShowToast } = props;
  const { title, message } = toast;
  const hasMessage = Boolean(message);

  if (!showToast) {
    return null;
  }

  return (
    <div className="tw-fixed tw-inset-0 tw-z-[100] tw-h-full tw-w-full">
      <button
        type="button"
        aria-label="Close notification backdrop"
        className="tw-fixed tw-inset-0 tw-z-[100] tw-h-full tw-w-full tw-border-0 tw-bg-black/60 tw-p-0 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400"
        onClick={() => setShowToast(false)}
      />
      <div
        className="tw-fixed tw-left-1/2 tw-top-1/2 tw-z-[101] tw-w-[min(92vw,420px)] -tw-translate-x-1/2 -tw-translate-y-1/2 tw-overflow-hidden tw-rounded-xl tw-bg-white tw-text-black tw-shadow-2xl"
        ref={toastRef}
        role="status"
        aria-live="polite"
      >
        <div className="tw-flex tw-items-center tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-black/10 tw-px-3 tw-py-2">
          <span className="tw-mr-auto tw-font-semibold">{title}</span>
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
          <div className="tw-px-4 tw-py-4 [&_a]:tw-font-semibold [&_a]:tw-text-black [&_a]:tw-underline">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
