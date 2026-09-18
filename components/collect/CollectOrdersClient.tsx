"use client";

import { isAuthResolving } from "@/components/auth/authResolution";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiMarketOperationResult } from "@/generated/models/ApiMarketOperationResult";
import { ApiMarketBatchOperationKindEnum } from "@/generated/models/ApiMarketBatchOperation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { fetchMarketHistoryWithBatches } from "@/services/api/market-batch-api";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchRecoverableMarketOperation } from "./market-recovery";
import { fetchRecoverableMarketBatch } from "./market-batch-recovery";
import { recordMarketActivity } from "./market-activity-store";
import { reconcileMarketHistory } from "./market-history-reconciliation";
import CollectOrdersView from "./CollectOrdersView";
import CollectTradeController from "./CollectTradeController";
import CollectRulesPanel from "./CollectRulesPanel";
import { marketOperationView } from "./market.adapters";
import type { CollectTradeAction } from "./collect.types";
import CollectBatchController from "./CollectBatchController";
import { marketBatchOperationView } from "./market-batch.adapters";
import { collectProfileWallets } from "./collect-recipient.helpers";

interface ReceiptLinkProps {
  readonly initialOperationId?: string | undefined;
  readonly initialBatch?: boolean | undefined;
}
export default function CollectOrdersClient(props: ReceiptLinkProps) {
  const { connectedProfile, isAuthenticated, activeProfileProxy } = useAuth();
  const membership = collectProfileWallets(connectedProfile)
    .map((wallet) => wallet.wallet.toLowerCase())
    .sort((left, right) => left.localeCompare(right))
    .join(":");
  return (
    <ProfileOrders
      key={JSON.stringify([
        connectedProfile?.id,
        membership,
        Boolean(isAuthenticated),
        Boolean(activeProfileProxy),
      ])}
      {...props}
    />
  );
}
function ProfileOrders({ initialOperationId, initialBatch }: ReceiptLinkProps) {
  const locale = useBrowserLocale();
  const {
    connectedProfile,
    isAuthenticated,
    activeProfileProxy,
    fetchingProfile,
  } = useAuth();
  const canReadOrders =
    isAuthenticated === true &&
    Boolean(connectedProfile?.id) &&
    !activeProfileProxy;
  const { seizeConnect, connectionState } = useSeizeConnectContext();
  const [selection, setSelected] = useState<{
    operation: ApiMarketOperationResult;
    cancel: boolean;
  } | null>(null);
  const [closedReceiptId, setClosedReceiptId] = useState<string | undefined>();
  const receipt = useQuery<ApiMarketOperationResult>({
    queryKey: initialBatch
      ? [
          QueryKey.MARKET_OPERATION,
          "BUY_BATCH",
          connectedProfile?.id,
          initialOperationId,
        ]
      : [QueryKey.MARKET_OPERATION, connectedProfile?.id, initialOperationId],
    queryFn: ({ signal }) => {
      const profileId = connectedProfile?.id;
      if (!profileId || !initialOperationId)
        throw new Error("MARKET_PROFILE_CHANGED");
      return initialBatch
        ? fetchRecoverableMarketBatch(initialOperationId, profileId, signal)
        : fetchRecoverableMarketOperation(
            initialOperationId,
            profileId,
            signal
          );
    },
    enabled: Boolean(initialOperationId && canReadOrders),
  });
  const linkedReceipt =
    canReadOrders &&
    initialOperationId &&
    closedReceiptId !== initialOperationId &&
    receipt.data?.id === initialOperationId &&
    receipt.data.profile_id === connectedProfile?.id
      ? { operation: receipt.data, cancel: false }
      : null;
  const selected = selection ?? linkedReceipt;
  const closeReceipt = () => {
    setClosedReceiptId(initialOperationId);
    setSelected(null);
  };
  const operations = useInfiniteQuery({
    queryKey: [
      QueryKey.MARKET_MY_OPERATIONS,
      connectedProfile?.id,
      "include-batches",
    ],
    queryFn: ({ signal, pageParam }) =>
      fetchMarketHistoryWithBatches(signal, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next,
    enabled: canReadOrders,
    refetchInterval: 10_000,
  });
  const savedOperations = canReadOrders
    ? (operations.data?.pages
        .flatMap((page) => page.operations)
        .filter((operation) => operation.profile_id === connectedProfile?.id) ??
      [])
    : [];
  const liveIds = savedOperations
    .filter((operation) => operation.state.toString() === "LIVE")
    .map((operation) => operation.id)
    .join(":");
  const reconciled = useQuery({
    queryKey: [
      QueryKey.MARKET_MY_OPERATIONS,
      connectedProfile?.id,
      "live-receipts",
      liveIds,
    ],
    queryFn: ({ signal }) => {
      const profileId = connectedProfile?.id;
      if (!profileId) throw new Error("MARKET_PROFILE_CHANGED");
      return reconcileMarketHistory(savedOperations, profileId, signal);
    },
    enabled: canReadOrders && liveIds.length > 0,
    refetchInterval: 30_000,
  });
  const ownOperations = savedOperations.map((operation) => {
    const latest = reconciled.data?.find((item) => item.id === operation.id);
    return latest &&
      latest.profile_id === connectedProfile?.id &&
      latest.updated_at >= operation.updated_at
      ? latest
      : operation;
  });
  useEffect(() => {
    if (!canReadOrders) return;
    for (const operation of reconciled.data ?? [])
      if (operation.profile_id === connectedProfile?.id)
        recordMarketActivity(operation);
  }, [reconciled.data, connectedProfile?.id, canReadOrders]);
  useEffect(() => {
    if (!canReadOrders) return;
    for (const page of operations.data?.pages ?? [])
      for (const operation of page.operations)
        if (operation.profile_id === connectedProfile?.id)
          recordMarketActivity(operation);
  }, [operations.data, connectedProfile?.id, canReadOrders]);
  const select = (id: string, cancel: boolean) => {
    const operation = ownOperations.find((item) => item.id === id);
    if (
      canReadOrders &&
      operation &&
      !(cancel && operation.kind === ApiMarketBatchOperationKindEnum.BuyBatch)
    )
      setSelected({ operation, cancel });
  };
  if (activeProfileProxy)
    return (
      <p role="status" className="tw-p-6 tw-text-sm tw-text-iron-300">
        {t(locale, "collect.orders.proxyUnavailable")}
      </p>
    );
  return (
    <>
      <CollectOrdersView
        orders={ownOperations.map((operation) =>
          operation.kind === ApiMarketBatchOperationKindEnum.BuyBatch
            ? marketBatchOperationView(operation, locale)
            : marketOperationView(operation, locale)
        )}
        loading={isAuthenticated === true && operations.isPending}
        authenticated={canReadOrders}
        resolvingAuth={isAuthResolving(connectionState, fetchingProfile)}
        error={
          operations.isError ? t(locale, "collect.error.orders") : undefined
        }
        onConnect={seizeConnect}
        onRetry={() => {
          void operations.refetch();
        }}
        onInspect={(id) => select(id, false)}
        onCancel={(id) => select(id, true)}
        hasMore={operations.hasNextPage}
        loadingMore={operations.isFetchingNextPage}
        onLoadMore={() => {
          void operations.fetchNextPage();
        }}
      />
      {canReadOrders && receipt.isError && initialOperationId && (
        <p role="alert" className="tw-text-sm tw-text-iron-300">
          {t(locale, "collect.receipt.loadError")}
        </p>
      )}
      {canReadOrders && (
        <CollectRulesPanel
          onOperation={(operation) => {
            if (operation.profile_id === connectedProfile?.id)
              setSelected({ operation, cancel: false });
          }}
        />
      )}
      {canReadOrders &&
        selected?.operation.kind ===
          ApiMarketBatchOperationKindEnum.BuyBatch && (
          <CollectBatchController
            key={selected.operation.id}
            items={[]}
            initialOperation={selected.operation}
            onClose={closeReceipt}
          />
        )}
      {canReadOrders &&
        selected &&
        selected.operation.kind !==
          ApiMarketBatchOperationKindEnum.BuyBatch && (
          <CollectTradeController
            key={JSON.stringify([selected.operation.id, selected.cancel])}
            action={
              selected.cancel
                ? "cancel"
                : (selected.operation.kind.toLowerCase() as CollectTradeAction)
            }
            {...(selected.cancel
              ? { cancelTarget: selected.operation }
              : { initialOperation: selected.operation })}
            onClose={closeReceipt}
          />
        )}
    </>
  );
}
