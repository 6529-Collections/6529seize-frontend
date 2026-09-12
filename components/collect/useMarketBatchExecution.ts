"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import type { ApiMarketBatchPrepareRequest } from "@/generated/models/ApiMarketBatchPrepareRequest";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { Capacitor } from "@capacitor/core";
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
  const pending = useRef(false),
    mounted = useRef(false);
  const live = useRef({ auth, connection, wallet });
  useEffect(() => {
    live.current = { auth, connection, wallet };
  }, [auth, connection, wallet]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const assertActor = (
    operation: Pick<ApiMarketBatchOperation, "profile_id" | "wallet">
  ) => {
    const current = live.current;
    if (
      !mounted.current ||
      !current.auth.isAuthenticated ||
      current.auth.activeProfileProxy ||
      current.auth.connectedProfile?.id !== operation.profile_id ||
      current.connection.address?.toLowerCase() !==
        operation.wallet.toLowerCase()
    )
      throw new Error("MARKET_CONNECTION_CHANGED");
  };
  const run = async (work: () => Promise<void>) => {
    if (pending.current || !client) return;
    pending.current = true;
    setBusy(true);
    setMessage(undefined);
    try {
      await work();
    } catch (error) {
      if (mounted.current) setMessage(marketExecutionError(error, locale));
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const confirm = (
    operation: ApiMarketBatchOperation,
    expected: ApiMarketBatchPrepareRequest
  ) =>
    run(async () => {
      if (!wallet || !client) throw new Error("MARKET_CONNECTION_CHANGED");
      const assertConnection = () => {
        assertActor(operation);
        const current = live.current;
        if (
          Capacitor.isNativePlatform() ||
          !current.connection.canSignActiveWallet ||
          current.connection.isSafeWallet ||
          current.wallet !== wallet
        )
          throw new Error("MARKET_CONNECTION_CHANGED");
        validateMarketBatchRequest(
          expected,
          collectProfileWallets(current.auth.connectedProfile).map(
            (item) => item.wallet
          )
        );
      };
      const result = await confirmMarketBatch({
        client,
        wallet,
        operation,
        expected,
        profileWallets: collectProfileWallets(auth.connectedProfile).map(
          (item) => item.wallet
        ),
        assertConnection,
        onOperation: (value) => {
          if (mounted.current) onOperation(value);
        },
      });
      if (result === "UPDATED_REVIEW" && mounted.current)
        setMessage(t(locale, "collect.trade.refreshReview"));
    });
  const recoverTransaction = (
    operation: ApiMarketBatchOperation,
    hash: string
  ) =>
    run(async () => {
      if (!client) return;
      await withMarketOperationLock(operation.id, () =>
        recoverMarketBatch({
          client,
          operation,
          hash,
          assertConnection: () => assertActor(operation),
          onOperation: (value) => {
            if (mounted.current) onOperation(value);
          },
        })
      );
    });
  return { confirm, recoverTransaction, busy, message };
}
