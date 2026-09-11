"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { fetchMyMarketOperations } from "@/services/api/market-api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import CollectOrdersView from "./CollectOrdersView";
import CollectTradeController from "./CollectTradeController";
import CollectRulesPanel from "./CollectRulesPanel";
import { marketOperationView } from "./market.adapters";
import type { CollectTradeAction } from "./collect.types";

export default function CollectOrdersClient() {
  const { connectedProfile } = useAuth();
  return <ProfileOrders key={connectedProfile?.id ?? "public"} />;
}
function ProfileOrders() {
  const locale = useBrowserLocale();
  const { connectedProfile, isAuthenticated } = useAuth();
  const { seizeConnect } = useSeizeConnectContext();
  const [selected, setSelected] = useState<{
    operation: ApiMarketOperation;
    cancel: boolean;
  } | null>(null);
  const operations = useInfiniteQuery({
    queryKey: [QueryKey.MARKET_MY_OPERATIONS, connectedProfile?.id],
    queryFn: ({ signal, pageParam }) =>
      fetchMyMarketOperations(signal, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next,
    enabled: isAuthenticated === true && Boolean(connectedProfile?.id),
    refetchInterval: 10_000,
  });
  const ownOperations =
    operations.data?.pages.flatMap((page) => page.operations) ?? [];
  const select = (id: string, cancel: boolean) => {
    const operation = ownOperations.find((item) => item.id === id);
    if (operation) setSelected({ operation, cancel });
  };
  return (
    <>
      <CollectOrdersView
        orders={ownOperations.map((operation) =>
          marketOperationView(operation, locale)
        )}
        loading={isAuthenticated === true && operations.isPending}
        authenticated={isAuthenticated === true}
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
      <CollectRulesPanel
        onOperation={(operation) => setSelected({ operation, cancel: false })}
      />
      {selected && (
        <CollectTradeController
          key={`${selected.operation.id}:${selected.cancel}`}
          action={
            selected.cancel
              ? "cancel"
              : (selected.operation.kind.toLowerCase() as CollectTradeAction)
          }
          {...(selected.cancel
            ? { cancelTarget: selected.operation }
            : { initialOperation: selected.operation })}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
