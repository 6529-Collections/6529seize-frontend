"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Toast, ToastContainer } from "react-bootstrap";
import styles from "./Delegation.module.scss";

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
  return (
    <div className={styles["toastWrapper"]}>
      <button
        type="button"
        aria-label="Dismiss delegation notification"
        className={styles["toastBackdrop"]}
        onClick={() => props.setShowToast(false)}
      />
      <ToastContainer
        position={"top-center"}
        className={styles["toast"]}
        ref={props.toastRef}
      >
        <Toast onClose={() => props.setShowToast(false)} show={props.showToast}>
          <Toast.Header>
            <span className="me-auto">{props.toast.title}</span>
          </Toast.Header>
          {props.toast.message && (
            <Toast.Body>{props.toast.message}</Toast.Body>
          )}
        </Toast>
      </ToastContainer>
    </div>
  );
}
