"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import type { ApiMarketBatchPrepareRequest } from "@/generated/models/ApiMarketBatchPrepareRequest";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useEffect, useRef, useState } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { collectProfileWallets } from "./collect-recipient.helpers";
import { marketExecutionError } from "./market-execution-errors";
import {
  confirmMarketBatch,
  recoverMarketBatch,
} from "./market-batch-execution";
import { validateMarketBatchRequest } from "./market-batch-validation";
import { withMarketOperationLock } from "./market-operation-lock";
import { useMarketWalletScope } from "./useMarketWalletScope";
import type { CollectTradeStage } from "./collect.types";
import { marketReviewChangeDescription } from "./market-review-change-description";

export function useMarketBatchExecution(
  onOperation: (operation: ApiMarketBatchOperation) => void
) {
  const auth = useAuth(),
    connection = useSeizeConnectContext();
  const { data: wallet } = useWalletClient();
  const client = usePublicClient({ chainId: 1 }),
    locale = useBrowserLocale();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState<string>();
  const [stage, setStage] = useState<CollectTradeStage | null>(null);
  const [knownTransaction, setKnownTransaction] = useState<{
    operationId: string;
    hash: string;
  }>();
  const walletScope = useMarketWalletScope({
    auth,
    connection,
    wallet,
    client,
  });
  const pending = useRef(false),
    mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const run = async (work: () => Promise<void>) => {
    if (pending.current) return;
    if (!client) {
      setMessage(t(locale, "collect.trade.walletNotReady"));
      return;
    }
    pending.current = true;
    setBusy(true);
    setMessage(undefined);
    setStage("preparing");
    try {
      await work();
    } catch (error) {
      if (mounted.current) setMessage(marketExecutionError(error, locale));
    } finally {
      pending.current = false;
      if (mounted.current) {
        setBusy(false);
        setStage(null);
      }
    }
  };
  const confirm = (
    operation: ApiMarketBatchOperation,
    expected: ApiMarketBatchPrepareRequest,
    guard?: () => void
  ) =>
    run(async () => {
      if (!wallet || !client) throw new Error("MARKET_WALLET_NOT_READY");
      const assertScope = walletScope.capture(expected);
      const assertConnection = () => {
        guard?.();
        assertScope();
        validateMarketBatchRequest(
          expected,
          collectProfileWallets(auth.connectedProfile).map(
            (item) => item.wallet
          )
        );
      };
      await confirmMarketBatch({
        client,
        wallet,
        operation,
        expected,
        profileWallets: collectProfileWallets(auth.connectedProfile).map(
          (item) => item.wallet
        ),
        assertConnection,
        onStage: (next) => {
          if (mounted.current) setStage(next);
        },
        onKnownHash: (hash) => {
          if (mounted.current)
            setKnownTransaction({ operationId: operation.id, hash });
        },
        onReviewChange: (change, shown, fresh) => {
          if (mounted.current)
            setMessage(
              marketReviewChangeDescription(shown, fresh, locale, change)
            );
        },
        onOperation: (value) => {
          if (mounted.current) onOperation(value);
        },
      });
    });
  const recoverTransaction = (
    operation: ApiMarketBatchOperation,
    hash: string
  ) =>
    run(async () => {
      if (!client) return;
      const assertConnection = walletScope.capture(operation, true);
      setStage("reconciling");
      await withMarketOperationLock(operation.id, () =>
        recoverMarketBatch({
          client,
          operation,
          hash,
          assertConnection,
          onOperation: (value) => {
            if (mounted.current) onOperation(value);
          },
        })
      );
    });
  return {
    confirm,
    recoverTransaction,
    busy,
    stage,
    knownTransaction,
    ready: walletScope.ready,
    readinessReason: walletScope.readinessReason,
    message,
    clearMessage: () => setMessage(undefined),
  };
}
