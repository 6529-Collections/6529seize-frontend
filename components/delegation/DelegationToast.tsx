"use client";

import { useCallback, useState } from "react";

import OnchainTransactionModal, {
  type OnchainTransactionModalStatus,
} from "@/components/common/OnchainTransactionModal";
import { DELEGATION_CONTRACT } from "@/constants/constants";

export interface DelegationToastState {
  readonly status: OnchainTransactionModalStatus;
  readonly title: string;
  readonly message?: string | undefined;
  readonly transactionHash?: string | undefined;
}

export function useDelegationToast(
  options: {
    /** Runs when a write's success toast is shown, i.e. its receipt is in. */
    readonly onSuccess?: (() => void) | undefined;
  } = {}
) {
  const { onSuccess } = options;
  const [toast, setToast] = useState<DelegationToastState | undefined>(
    undefined
  );
  const [showToast, setShowToast] = useState(false);

  const showDelegationToast = useCallback(
    (nextToast: DelegationToastState) => {
      setToast(nextToast);
      setShowToast(true);
      if (nextToast.status === "success") {
        onSuccess?.();
      }
    },
    [onSuccess]
  );

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
    toast,
    showToast,
    showDelegationToast,
    clearDelegationToast,
    setToastVisibility,
  };
}

export function DelegationToast(
  props: Readonly<{
    toast: DelegationToastState;
    showToast: boolean;
    setShowToast: (show: boolean) => void;
  }>
) {
  const { toast, showToast, setShowToast } = props;

  if (!showToast) {
    return null;
  }

  return (
    <OnchainTransactionModal
      status={toast.status}
      title={toast.title}
      message={toast.message}
      transactionHash={toast.transactionHash}
      chain={{ id: DELEGATION_CONTRACT.chain_id }}
      onClose={() => setShowToast(false)}
    />
  );
}
