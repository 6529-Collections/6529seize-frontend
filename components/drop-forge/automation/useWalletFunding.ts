"use client";
import { getWalletClient } from "@wagmi/core";
import { useEffect, useRef, useState } from "react";
import { formatEther, parseEther, type Address, type Hash } from "viem";
import { useConfig, usePublicClient } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { getForgeSettings } from "@/services/api/drop-forge-settings";
import type { ApiDropForgeSettings } from "@/generated/models/ApiDropForgeSettings";
import type { SupportedLocale } from "@/i18n/locales";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import type { OnchainTransactionModalStatus } from "@/components/common/OnchainTransactionModal";

import { useFundingReports } from "./useFundingReports";

class WalletFundingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalletFundingError";
  }
}
function validFundingAmount(amount: string): boolean {
  const parts = amount.split(".");
  return (
    parts.length <= 2 &&
    parts.every((part) => part.length > 0 && !/\D/.test(part)) &&
    (parts[1]?.length ?? 0) <= 18 &&
    parseEther(amount) > 0n
  );
}

type FundingTransaction = {
  status: OnchainTransactionModalStatus;
  hash?: string;
  message?: string;
};
function fundingOutcome(
  receiptSuccess: boolean,
  cancelled: boolean,
  changed: boolean,
  hash: string,
  locale: SupportedLocale
): FundingTransaction {
  const success = receiptSuccess && !cancelled && !changed;
  let messageKey:
    | "dropForge.funding.failed"
    | "dropForge.funding.confirmed"
    | "dropForge.funding.cancelled"
    | "dropForge.funding.replaced" = "dropForge.funding.failed";
  if (success) messageKey = "dropForge.funding.confirmed";
  if (changed) messageKey = "dropForge.funding.replaced";
  if (cancelled) messageKey = "dropForge.funding.cancelled";
  return {
    status: success ? "success" : "error",
    hash,
    message: t(locale, messageKey),
  };
}

async function confirmFunding(
  client: NonNullable<ReturnType<typeof usePublicClient>>,
  hash: Hash,
  target: { address: string; value: bigint },
  onReplacement: (hash: Hash) => void,
  locale: SupportedLocale
): Promise<FundingTransaction> {
  const replacementState = { cancelled: false, changed: false };
  const receipt = await client.waitForTransactionReceipt({
    hash,
    onReplaced: (replacement) => {
      replacementState.cancelled = replacement.reason === "cancelled";
      replacementState.changed =
        replacement.transaction.to?.toLowerCase() !==
          target.address.toLowerCase() ||
        replacement.transaction.value !== target.value ||
        replacement.transaction.input !== "0x";
      onReplacement(replacement.transaction.hash);
    },
  });
  return fundingOutcome(
    receipt.status === "success",
    replacementState.cancelled,
    replacementState.changed,
    receipt.transactionHash,
    locale
  );
}

export function useWalletFunding(
  settings: ApiDropForgeSettings,
  amount: string,
  onConfirmed: () => void
) {
  const { address } = useSeizeConnectContext();
  const { requestAuth } = useAuth();
  const locale = useBrowserLocale();
  const config = useConfig();
  const publicClient = usePublicClient({ chainId: settings.chain_id });
  const chain = settings.chain_id === 1 ? mainnet : sepolia;
  const context = `${address?.toLowerCase() ?? ""}:${chain.id}:${settings.signer_address.toLowerCase()}:${amount}`;
  const current = useRef(context);
  useEffect(() => {
    current.current = context;
  }, [context]);
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<{ context: string; fee: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<FundingTransaction | null>(
    null
  );
  const prefix = `drop-forge-funding:${address?.toLowerCase() ?? ""}:${chain.id}:${settings.signer_address.toLowerCase()}:`;
  const reports = useFundingReports(prefix);
  const { retainHash } = reports;
  const inFlight = useRef(false);

  async function prepare() {
    if (inFlight.current || !address || !publicClient) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    setReview(null);
    const captured = context;
    try {
      if (!validFundingAmount(amount))
        throw new WalletFundingError(t(locale, "dropForge.funding.invalid"));
      const value = parseEther(amount);
      const gas = await publicClient.estimateGas({
        account: address as Address,
        to: settings.signer_address as Address,
        value,
      });
      const fees = await publicClient.estimateFeesPerGas();
      const fee = gas * fees.maxFeePerGas;
      if (
        (await publicClient.getBalance({ address: address as Address })) <
        value + fee
      )
        throw new WalletFundingError(
          t(locale, "dropForge.funding.insufficient")
        );
      if (current.current !== captured)
        throw new WalletFundingError(t(locale, "dropForge.funding.changed"));
      setReview({ context: captured, fee: formatEther(fee) });
    } catch (e) {
      setError(
        e instanceof WalletFundingError
          ? e.message
          : (getToastErrorDetails(e) ?? t(locale, "dropForge.funding.failed"))
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function submit() {
    if (
      inFlight.current ||
      review?.context !== context ||
      !address ||
      !publicClient
    )
      return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    const captured = context;
    try {
      if (!(await requestAuth()).success) return;
      const fresh = await getForgeSettings();
      const wallet = await getWalletClient(config, { chainId: chain.id });
      if (
        current.current !== captured ||
        !fresh.can_top_up ||
        fresh.chain_id !== chain.id ||
        fresh.signer_address.toLowerCase() !==
          settings.signer_address.toLowerCase() ||
        wallet.account.address.toLowerCase() !== address.toLowerCase()
      )
        throw new WalletFundingError(t(locale, "dropForge.funding.changed"));
      setTransaction({ status: "confirm_wallet" });
      const hash = await wallet.sendTransaction({
        account: wallet.account,
        chain,
        to: settings.signer_address as Address,
        value: parseEther(amount),
      });
      retainHash(hash);
      setTransaction({ status: "submitted", hash });
      setReview(null);
      setTransaction(
        await confirmFunding(
          publicClient,
          hash,
          { address: settings.signer_address, value: parseEther(amount) },
          (replacement) => {
            retainHash(replacement);
            setTransaction({ status: "submitted", hash: replacement });
          },
          locale
        )
      );
      onConfirmed();
    } catch (e) {
      const message =
        e instanceof WalletFundingError
          ? e.message
          : (getToastErrorDetails(e) ?? t(locale, "dropForge.funding.failed"));
      setError(message);
      setTransaction((previous) => ({ ...previous, status: "error", message }));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return {
    busy,
    review: review?.context === context ? review : null,
    error:
      error ??
      (reports.storageError
        ? t(locale, "dropForge.funding.storageError")
        : null),
    pending: reports.pending,
    transaction,
    prepare,
    submit,
    cancelReview: () => setReview(null),
    closeTransaction: () => {
      if (!busy) setTransaction(null);
    },
    chain,
  };
}
