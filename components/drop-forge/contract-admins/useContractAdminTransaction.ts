"use client";

import { getWalletClient } from "@wagmi/core";
import { useQueryClient } from "@tanstack/react-query";
import { useLayoutEffect, useRef, useState } from "react";
import { BaseError, type Address, type Chain, type Hash } from "viem";
import { useConfig, usePublicClient, useWriteContract } from "wagmi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useConnectedAction } from "@/components/auth/useConnectedAction";
import type { OnchainTransactionModalStatus } from "@/components/common/OnchainTransactionModal";
import { CREATOR_ADMIN_ABI } from "./creator-admin-abi";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";

export type AdminOperation = {
  functionName: "approveAdmin" | "revokeAdmin";
  address: Address;
};

type AdminTransaction = AdminOperation & {
  status: OnchainTransactionModalStatus;
  chain: Chain;
  hash?: Hash | undefined;
  message?: string | undefined;
};

export function useContractAdminTransaction({
  contract,
  chain,
  canManage,
  contextFingerprint,
}: {
  contract: Address;
  chain: Chain;
  canManage: boolean;
  contextFingerprint: string;
}) {
  const { address } = useSeizeConnectContext();
  const locale = useBrowserLocale();
  const config = useConfig();
  const publicClient = usePublicClient({ chainId: chain.id });
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const [transaction, setTransaction] = useState<AdminTransaction | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const latestContext = useRef(contextFingerprint);
  useLayoutEffect(() => {
    latestContext.current = contextFingerprint;
  }, [contextFingerprint]);
  const runConnectedAction = useConnectedAction({ contextFingerprint });

  const execute = async (operation: AdminOperation) => {
    if (busyRef.current || !canManage || !address || !publicClient) return;
    busyRef.current = true;
    setBusy(true);
    const snapshot: AdminTransaction = {
      ...operation,
      chain,
      status: "confirm_wallet",
    };
    setTransaction(snapshot);
    try {
      const wallet = await getWalletClient(config, {
        chainId: chain.id,
        account: address as Address,
      });
      if (
        latestContext.current !== contextFingerprint ||
        wallet.account.address.toLowerCase() !== address.toLowerCase()
      ) {
        throw new Error(t(locale, "dropForge.admins.contextChanged"));
      }
      const hash = await writeContractAsync({
        address: contract,
        abi: CREATOR_ADMIN_ABI,
        functionName: operation.functionName,
        args: [operation.address],
        account: wallet.account,
        chainId: chain.id,
      });
      setTransaction({ ...snapshot, status: "submitted", hash });
      const replacement = { changed: false };
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        onReplaced: ({ reason, transactionReceipt }) => {
          replacement.changed ||= reason !== "repriced";
          setTransaction({
            ...snapshot,
            status: "submitted",
            hash: transactionReceipt.transactionHash,
          });
        },
      });
      if (replacement.changed || receipt.status !== "success")
        throw new Error(t(locale, "dropForge.admins.transactionChanged"));
      setTransaction({
        ...snapshot,
        status: "success",
        hash: receipt.transactionHash,
      });
      // Refresh creator reads, including permission hooks shared by navigation.
      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) => {
          const parameters = queryKey[1] as
            | { address?: string; chainId?: number }
            | undefined;
          return (
            queryKey[0] === "readContract" &&
            parameters?.address?.toLowerCase() === contract.toLowerCase() &&
            parameters.chainId === chain.id
          );
        },
      });
    } catch (error) {
      const message = getAdminTransactionError(error, locale);
      setTransaction((current) => ({
        ...snapshot,
        hash: current?.hash,
        status: "error",
        message,
      }));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return {
    transaction,
    busy,
    closeTransaction: () => setTransaction(null),
    submit: (operation: AdminOperation) =>
      runConnectedAction(() => {
        void execute(operation);
      }),
  };
}

function getAdminTransactionError(
  error: unknown,
  locale: SupportedLocale
): string {
  if (error instanceof BaseError) return error.shortMessage;
  if (error instanceof Error) return error.message;
  return t(locale, "dropForge.admins.transactionError");
}
