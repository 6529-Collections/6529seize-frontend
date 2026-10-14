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
import {
  getConsolidationStepWriteParams,
  getManagerLinkWriteParams,
} from "./consolidation-contract";
import {
  toDirectedLinkKey,
  type ConsolidationStepProgress,
} from "./consolidation-plan";

interface StepLink {
  readonly number: number;
  readonly total: number;
}

interface StepSubmission {
  readonly attempt: number;
  readonly signer: string;
  readonly targets: readonly string[];
  readonly stepNumber: number;
  /** The link a manager sends, when its step has several. */
  readonly link: StepLink | undefined;
}

type StepSubmitInput = Pick<
  ConsolidationStepProgress,
  "index" | "signer" | "targets" | "pendingTargets" | "signAs" | "nextLink"
>;

interface RecordedLinks {
  /** Transactions whose directions are already in `keys`. */
  readonly hashes: readonly string[];
  readonly keys: ReadonlySet<string>;
}

const NO_RECORDED_LINKS: RecordedLinks = { hashes: [], keys: new Set() };

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

function getStepToastTitles(
  locale: SupportedLocale,
  submission: Pick<StepSubmission, "stepNumber" | "link">
) {
  const step = formatInteger(locale, submission.stepNumber);
  const { link } = submission;
  if (link) {
    const params = {
      step,
      link: formatInteger(locale, link.number),
      total: formatInteger(locale, link.total),
    };
    return {
      title: t(
        locale,
        "delegation.consolidationBuilder.toast.linkTitle",
        params
      ),
      failedTitle: t(
        locale,
        "delegation.consolidationBuilder.toast.linkFailed",
        params
      ),
    };
  }
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
  const titles = getStepToastTitles(locale, submission);

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
 * Sends one consolidation step as a single transaction, or, for a manager
 * signing for the step's wallet, its next link (the contract has no batch for
 * managers, so each link is sent after the previous one). The wallet,
 * submission, confirmation, and failure states are derived as a toast that
 * the caller renders; dismissing hides it until the state changes. The
 * directions of every transaction confirmed in this session are kept in
 * `recordedLinkKeys`.
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
  const [recorded, setRecorded] = useState<RecordedLinks>(NO_RECORDED_LINKS);

  const confirmedHash = receipt.isSuccess ? write.data : undefined;
  if (confirmedHash && submission && !recorded.hashes.includes(confirmedHash)) {
    // Record the confirmed directions once per transaction, during render,
    // so the step never asks for a signature it already has.
    setRecorded({
      hashes: [...recorded.hashes, confirmedHash],
      keys: new Set([
        ...recorded.keys,
        ...submission.targets.map((target) =>
          toDirectedLinkKey(submission.signer, target)
        ),
      ]),
    });
  }

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

  function submit(step: StepSubmitInput) {
    const [nextTarget] = step.pendingTargets;
    if (!nextTarget) {
      return;
    }
    const asManager = step.signAs === "manager";
    const targets = asManager ? [nextTarget] : step.pendingTargets;
    setGasError(undefined);
    setSubmission((current) => ({
      attempt: (current?.attempt ?? 0) + 1,
      signer: step.signer,
      targets,
      stepNumber: step.index + 1,
      link:
        asManager && step.targets.length > 1
          ? { number: step.nextLink, total: step.targets.length }
          : undefined,
    }));
    write.writeContract(
      asManager
        ? getManagerLinkWriteParams(step.signer, nextTarget)
        : getConsolidationStepWriteParams(targets),
      { onError: (error) => setGasError(getGasError(error)) }
    );
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
    recordedLinkKeys: recorded.keys,
  };
}
