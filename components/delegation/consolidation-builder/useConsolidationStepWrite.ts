"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useEffect, useEffectEvent, useState } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { getTransactionErrorToastMessage } from "../collection-delegation/collection-delegation-helpers";
import { getGasError } from "../delegation-shared";
import type { DelegationToastState } from "../DelegationToast";
import { getConsolidationStepWriteParams } from "./consolidation-contract";

interface StepSubmission {
  readonly attempt: number;
  readonly signer: string;
  readonly stepNumber: number;
}

interface StepWriteSnapshot {
  readonly locale: SupportedLocale;
  readonly submission: StepSubmission | undefined;
  readonly isAwaitingWallet: boolean;
  readonly writeError: Error | null;
  readonly hash: string | undefined;
  readonly receipt: {
    readonly isLoading: boolean;
    readonly isSuccess: boolean;
    readonly isError: boolean;
    readonly error: Error | null;
  };
}

function getStepToastTitles(locale: SupportedLocale, stepNumber: number) {
  const step = formatInteger(locale, stepNumber);
  return {
    title: t(locale, "delegation.consolidationBuilder.toast.title", { step }),
    failedTitle: t(locale, "delegation.consolidationBuilder.toast.failed", {
      step,
    }),
  };
}

function getReceiptToast(
  snapshot: StepWriteSnapshot,
  hash: string,
  titles: ReturnType<typeof getStepToastTitles>
): DelegationToastState | undefined {
  const { locale, receipt } = snapshot;
  if (receipt.isSuccess) {
    return { status: "success", title: titles.title, transactionHash: hash };
  }
  if (receipt.isError) {
    return {
      status: "error",
      title: titles.failedTitle,
      message: getTransactionErrorToastMessage(
        receipt.error,
        t(locale, "delegation.consolidationBuilder.toast.confirmationFailed")
      ),
      transactionHash: hash,
    };
  }
  return receipt.isLoading
    ? { status: "submitted", title: titles.title, transactionHash: hash }
    : undefined;
}

function getStepWriteToast(
  snapshot: StepWriteSnapshot
): DelegationToastState | undefined {
  const { locale, submission, writeError, hash } = snapshot;
  if (!submission) {
    return undefined;
  }
  const titles = getStepToastTitles(locale, submission.stepNumber);

  if (writeError) {
    return {
      status: "error",
      title: titles.failedTitle,
      message: getTransactionErrorToastMessage(
        writeError,
        t(locale, "delegation.consolidationBuilder.toast.startFailed")
      ),
    };
  }
  if (hash) {
    return getReceiptToast(snapshot, hash, titles);
  }
  return snapshot.isAwaitingWallet
    ? { status: "confirm_wallet", title: titles.title }
    : undefined;
}

/**
 * Sends one consolidation step as a single transaction. Its wallet,
 * submission, confirmation, and failure states are derived as a toast that
 * the caller renders; dismissing hides it until the state changes.
 */
export function useConsolidationStepWrite(options: {
  readonly onConfirmed: () => void;
}) {
  const locale = useBrowserLocale();
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    confirmations: 1,
    hash: write.data,
  });
  const [submission, setSubmission] = useState<StepSubmission>();
  const [gasError, setGasError] = useState<string>();
  const [dismissedToastKey, setDismissedToastKey] = useState<string>();

  const toast = getStepWriteToast({
    locale,
    submission,
    isAwaitingWallet: write.isPending,
    writeError: write.error,
    hash: write.data,
    receipt: {
      isLoading: receipt.isLoading,
      isSuccess: receipt.isSuccess,
      isError: receipt.isError,
      error: receipt.error,
    },
  });
  const toastKey = toast
    ? [
        submission?.attempt,
        toast.status,
        toast.transactionHash ?? "",
        toast.message ?? "",
      ].join(":")
    : "";

  const emitConfirmed = useEffectEvent(() => {
    options.onConfirmed();
  });

  useEffect(() => {
    if (receipt.isSuccess && write.data) {
      emitConfirmed();
    }
  }, [receipt.isSuccess, write.data]);

  function submit(step: {
    readonly index: number;
    readonly signer: string;
    readonly pendingTargets: readonly string[];
  }) {
    setGasError(undefined);
    setSubmission((current) => ({
      attempt: (current?.attempt ?? 0) + 1,
      signer: step.signer,
      stepNumber: step.index + 1,
    }));
    write.writeContract(getConsolidationStepWriteParams(step.pendingTargets), {
      onError: (error) => setGasError(getGasError(error)),
    });
  }

  const isBusy = write.isPending || receipt.isLoading;

  return {
    submit,
    isBusy,
    busySigner: isBusy ? submission?.signer : undefined,
    gasError,
    gasErrorSigner: gasError ? submission?.signer : undefined,
    toast,
    showToast: toast !== undefined && toastKey !== dismissedToastKey,
    dismissToast: () => setDismissedToastKey(toastKey),
  };
}
