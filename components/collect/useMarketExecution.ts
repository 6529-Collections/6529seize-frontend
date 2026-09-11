"use client";

import { useAuth } from "@/components/auth/Auth";
import { Capacitor } from "@capacitor/core";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import { ApiMarketOperationStateEnum } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketTransaction } from "@/generated/models/ApiMarketTransaction";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import { fetchCollectCapabilities } from "@/services/api/collect-api";
import {
  continueMarketOperation,
  fetchMarketOperation,
  submitMarketSignature,
  submitMarketTransaction,
} from "@/services/api/market-api";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useEffect, useRef, useState } from "react";
import {
  getAddress,
  type Hex,
  type WalletClient,
  type PublicClient,
} from "viem";
import { mainnet } from "viem/chains";
import { usePublicClient, useWalletClient } from "wagmi";
import type { CollectTradeStage } from "./collect.types";
import {
  marketTypedData,
  validateMarketOperation,
  validateMarketTransaction,
} from "./market-validation";
import { readMarketIntent, saveMarketIntent } from "./market-operation-storage";
import { withMarketOperationLock } from "./market-operation-lock";
import { marketReviewTerms } from "./market-review-terms";
import { marketExecutionError } from "./market-execution-errors";

async function checkMarketWallet(
  wallet: WalletClient,
  client: PublicClient,
  expected: ApiMarketPrepareRequest
) {
  if ((await wallet.getChainId()) !== 1) throw new Error("MARKET_WRONG_CHAIN");
  const accounts = await wallet.getAddresses();
  if (
    !accounts.some(
      (address) => address.toLowerCase() === expected.wallet.toLowerCase()
    )
  )
    throw new Error("MARKET_CONNECTION_CHANGED");
  const account = getAddress(expected.wallet);
  const code = await client.getCode({ address: account });
  if (code && code !== "0x") throw new Error("MARKET_UNSUPPORTED_WALLET");
  return account;
}

async function reviewedGasLimits(
  client: PublicClient,
  transaction: ApiMarketTransaction,
  estimatedGas: bigint
) {
  if (
    !transaction.gas_limit ||
    !transaction.max_fee_per_gas ||
    !transaction.gas_reserve_wei
  )
    throw new Error("MARKET_GAS_CAP_MISSING");
  const gas = BigInt(transaction.gas_limit);
  const maxFeePerGas = BigInt(transaction.max_fee_per_gas);
  if (
    estimatedGas > gas ||
    gas <= 0n ||
    maxFeePerGas <= 0n ||
    gas * maxFeePerGas > BigInt(transaction.gas_reserve_wei)
  )
    throw new Error("MARKET_GAS_CAP_CHANGED");
  const fees = await client.estimateFeesPerGas();
  if (fees.maxPriorityFeePerGas > maxFeePerGas)
    throw new Error("MARKET_GAS_CAP_CHANGED");
  return { gas, maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas };
}

async function executeReviewedMarketOperation(options: {
  wallet: WalletClient;
  client: PublicClient;
  operation: ApiMarketOperation;
  expected: ApiMarketPrepareRequest;
  assertConnection: () => void;
  setStage: (stage: CollectTradeStage) => void;
  onOperation: (operation: ApiMarketOperation) => void;
}) {
  const {
    wallet,
    client,
    operation,
    expected,
    assertConnection,
    setStage,
    onOperation,
  } = options;
  const account = await checkMarketWallet(wallet, client, expected);
  const approval = operation.approval_transactions[0];
  const transaction = approval ?? operation.transaction;
  if (transaction) {
    validateMarketTransaction(transaction, operation, expected);
    const request = {
      account,
      to: getAddress(transaction.to),
      value: BigInt(transaction.value),
      data: transaction.data as Hex,
      chain: mainnet,
    };
    await client.call(request);
    const estimatedGas = await client.estimateGas(request);
    const fees = await reviewedGasLimits(client, transaction, estimatedGas);
    assertConnection();
    validateMarketOperation(operation, expected);
    setStage(approval ? "approval" : "submitted");
    const hash = await wallet.sendTransaction({
      ...request,
      ...fees,
    });
    // Persist the hash before any network request. An uncertain submission can only retry this hash.
    if (!approval) {
      saveMarketIntent(expected.profile_id, operation.id, {
        request: expected,
        transactionHash: hash,
      });
      onOperation(
        await submitMarketTransaction(operation.id, {
          transaction_hash: hash,
        })
      );
    } else {
      saveMarketIntent(expected.profile_id, operation.id, {
        request: expected,
        approvalHash: hash,
      });
      const receipt = await client.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });
      saveMarketIntent(expected.profile_id, operation.id, {
        request: expected,
      });
      onOperation(await continueMarketOperation(operation.id));
      if (receipt.status !== "success")
        throw new Error("MARKET_APPROVAL_REVERTED");
    }
  } else {
    if (
      !operation.order ||
      !["LIST", "OFFER"].includes(operation.kind) ||
      operation.state !== ApiMarketOperationStateEnum.AwaitingSignature
    )
      throw new Error("MARKET_REVIEW_MISMATCH");
    assertConnection();
    validateMarketOperation(operation, expected);
    setStage("signature");
    const signature = await wallet.signTypedData({
      ...marketTypedData(operation.order.components),
      account,
    });
    setStage("publishing");
    onOperation(await submitMarketSignature(operation.id, { signature }));
  }
}

export function useMarketExecution(
  onOperation: (operation: ApiMarketOperation) => void
) {
  const locale = useBrowserLocale();
  const auth = useAuth();
  const connection = useSeizeConnectContext();
  const { data: wallet } = useWalletClient();
  const client = usePublicClient({ chainId: 1 });
  const [stage, setStage] = useState<CollectTradeStage | null>(null);
  const [message, setMessage] = useState<string | undefined>();
  const busy = useRef(false);
  const live = useRef({ auth, connection, wallet });
  useEffect(() => {
    live.current = { auth, connection, wallet };
  }, [auth, connection, wallet]);
  const confirm = async (
    operation: ApiMarketOperation,
    expected: ApiMarketPrepareRequest
  ) => {
    if (busy.current || !client || !wallet) return;
    busy.current = true;
    setMessage(undefined);
    try {
      await withMarketOperationLock(operation.id, async () => {
        const assertConnection = () => {
          const current = live.current;
          if (
            Capacitor.isNativePlatform() ||
            !current.auth.isAuthenticated ||
            current.auth.activeProfileProxy ||
            current.auth.connectedProfile?.id !== expected.profile_id ||
            !current.connection.canSignActiveWallet ||
            current.connection.isSafeWallet ||
            current.connection.address?.toLowerCase() !==
              expected.wallet.toLowerCase() ||
            current.wallet !== wallet
          )
            throw new Error("MARKET_CONNECTION_CHANGED");
        };
        assertConnection();
        const capability = await fetchCollectCapabilities();
        if (
          !capability.actions.some(
            (action) =>
              action.action.toString() === expected.kind.toString() &&
              action.enabled
          )
        )
          throw new Error("MARKET_ACTION_DISABLED");
        let current = await fetchMarketOperation(operation.id);
        if (current.revision !== operation.revision) {
          onOperation(current);
          setStage(null);
          setMessage(t(locale, "collect.trade.refreshReview"));
          return;
        }
        const prior = readMarketIntent(expected.profile_id, current.id);
        if (prior?.transactionHash) {
          setStage("reconciling");
          onOperation(
            await submitMarketTransaction(current.id, {
              transaction_hash: prior.transactionHash,
            })
          );
          return;
        }
        if (prior?.approvalHash) {
          setStage("approval");
          const receipt = await client.waitForTransactionReceipt({
            hash: prior.approvalHash,
            confirmations: 1,
          });
          saveMarketIntent(expected.profile_id, current.id, {
            request: expected,
          });
          onOperation(await continueMarketOperation(current.id));
          setStage(null);
          if (receipt.status !== "success")
            throw new Error("MARKET_APPROVAL_REVERTED");
          return;
        }
        if (
          !["REVIEW", "APPROVAL", "AWAITING_SIGNATURE"].includes(current.state)
        ) {
          onOperation(current);
          return;
        }
        validateMarketOperation(current, expected);
        if (["BUY", "ACCEPT", "CANCEL"].includes(current.kind)) {
          const refreshed = await continueMarketOperation(current.id);
          validateMarketOperation(refreshed, expected);
          if (marketReviewTerms(refreshed) !== marketReviewTerms(current)) {
            onOperation(refreshed);
            setStage(null);
            setMessage(t(locale, "collect.trade.refreshReview"));
            return;
          }
          current = refreshed;
          onOperation(refreshed);
        }
        if (
          ["LIST", "OFFER"].includes(current.kind) &&
          current.state === ApiMarketOperationStateEnum.Review &&
          current.approval_transactions.length === 0
        ) {
          onOperation(await continueMarketOperation(current.id));
          setStage(null);
          setMessage(t(locale, "collect.trade.refreshReview"));
          return;
        }
        if (
          !saveMarketIntent(expected.profile_id, current.id, {
            request: expected,
          })
        )
          throw new Error("MARKET_RECOVERY_STORAGE_UNAVAILABLE");
        await executeReviewedMarketOperation({
          wallet,
          client,
          operation: current,
          expected,
          assertConnection,
          setStage,
          onOperation,
        });
        setStage(null);
      });
    } catch (error) {
      setMessage(marketExecutionError(error, locale));
      setStage(null);
    } finally {
      busy.current = false;
    }
  };
  return { confirm, stage, message };
}
