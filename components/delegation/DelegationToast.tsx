"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./Delegation.module.scss";

interface DelegationToastState {
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
  if (!props.showToast) {
    return null;
  }

  return (
    <div className={styles["toastWrapper"]}>
      <button
        type="button"
        aria-label="Close notification backdrop"
        className={styles["toastBackdrop"]}
        onClick={() => props.setShowToast(false)}
      />
      <div
        className={`${styles["toast"]} tw-w-[min(92vw,420px)] tw-overflow-hidden tw-rounded-lg tw-bg-white tw-text-black tw-shadow-xl`}
        ref={props.toastRef}
        role="status"
        aria-live="polite"
      >
        <div className="tw-flex tw-items-center tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-black/10 tw-px-3 tw-py-2">
          <span className="tw-mr-auto tw-font-semibold">
            {props.toast.title}
          </span>
          <button
            type="button"
            aria-label="Dismiss delegation notification"
            className="tw-border-0 tw-bg-transparent tw-p-1 tw-text-2xl tw-leading-none tw-text-black/60 hover:tw-text-black focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            onClick={() => props.setShowToast(false)}
          >
            &times;
          </button>
        </div>
        {props.toast.message && (
          <div className="tw-px-3 tw-py-3">{props.toast.message}</div>
        )}
      </div>
    </div>
  );
}
