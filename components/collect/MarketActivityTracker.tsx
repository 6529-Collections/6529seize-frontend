"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useQueries, useQueryClient, type Query } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchRecoverableMarketOperation } from "./market-recovery";
import { fetchRecoverableMarketBatch } from "./market-batch-recovery";
import {
  recordMarketActivity,
  useMarketActivities,
  type MarketActivity,
} from "./market-activity-store";
import { invalidateMarketSettlement } from "./useMarketSettlement";
import { marketReceiptRefreshInterval } from "./market-receipt-refresh";

const PENDING = new Set([
  "SUBMITTED",
  "MINED",
  "UNKNOWN",
  "PUBLISHING",
  "CANCEL_PENDING",
  "AWAITING_TRANSACTION",
]);
const SETTLED = new Set([
  "LIVE",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
  "FAILED",
]);
function completionTitle(activity: MarketActivity) {
  switch (activity.state) {
    case "LIVE":
      return activity.kind === "OFFER"
        ? "collect.receipt.title.offer"
        : "collect.receipt.title.list";
    case "CANCELLED":
      return "collect.receipt.title.cancel";
    case "EXPIRED":
      return "collect.activity.expired";
    case "FAILED":
      return "collect.activity.failed";
    default:
      if (activity.kind === "CANCEL") return "collect.receipt.title.cancel";
      return activity.kind === "ACCEPT" || activity.kind === "LIST"
        ? "collect.activity.saleConfirmed"
        : "collect.activity.purchaseConfirmed";
  }
}
/** Resumes only known operation IDs; it cannot open a wallet or submit a new purchase. */
export default function MarketActivityTracker() {
  const { connectedProfile, isAuthenticated, activeProfileProxy } = useAuth();
  const profileId =
    isAuthenticated && !activeProfileProxy ? connectedProfile?.id : undefined;
  return (
    <ProfileActivityTracker key={profileId ?? "public"} profileId={profileId} />
  );
}
function ProfileActivityTracker({
  profileId,
}: {
  readonly profileId: string | null | undefined;
}) {
  const activities = useMarketActivities(profileId);
  const locale = useBrowserLocale();
  const client = useQueryClient();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [completed, setCompleted] = useState<MarketActivity | null>(null);
  const [interacting, setInteracting] = useState(false);
  useEffect(() => {
    if (!completed || interacting) return;
    const timer = globalThis.setTimeout(() => setCompleted(null), 10_000);
    return () => globalThis.clearTimeout(timer);
  }, [completed, interacting]);
  const monitored = [
    ...activities.filter((a) => PENDING.has(a.state)).slice(0, 20),
    ...activities
      .filter(
        (a) =>
          (a.state === "LIVE" && pathname !== "/collect/orders") ||
          a.state === "CONFIRMED"
      )
      .slice(0, 20),
  ];
  const results = useQueries({
    queries: monitored.map((activity) => ({
      queryKey:
        activity.kind === "BUY_BATCH"
          ? [QueryKey.MARKET_OPERATION, "BUY_BATCH", profileId, activity.id]
          : [QueryKey.MARKET_OPERATION, profileId, activity.id],
      queryFn: ({
        signal,
      }: {
        signal: AbortSignal;
      }): Promise<ApiMarketOperation | ApiMarketBatchOperation> =>
        activity.kind === "BUY_BATCH"
          ? fetchRecoverableMarketBatch(activity.id, activity.profileId, signal)
          : fetchRecoverableMarketOperation(
              activity.id,
              activity.profileId,
              signal
            ),
      enabled: Boolean(profileId),
      staleTime: PENDING.has(activity.state) ? 5000 : 30_000,
      refetchInterval: (
        query: Query<ApiMarketOperation | ApiMarketBatchOperation>
      ) => {
        const operation = query.state.data;
        if (!operation) return PENDING.has(activity.state) ? 5000 : false;
        return PENDING.has(operation.state) ||
          operation.send_attempt?.status.toString() === "ACTIVE"
          ? 5000
          : marketReceiptRefreshInterval(operation);
      },
    })),
  });
  useEffect(() => {
    for (const result of results) {
      const operation = result.data;
      if (operation && operation.profile_id === profileId)
        recordMarketActivity(operation);
    }
  }, [results, profileId]);
  useEffect(
    () =>
      client.getQueryCache().subscribe((event) => {
        if (event.type !== "updated" || event.action.type !== "success") return;
        const queryKey: unknown = event.query.queryKey;
        if (
          !Array.isArray(queryKey) ||
          queryKey[0] !== QueryKey.MARKET_OPERATION
        )
          return;
        const operation = event.query.state.data as
          | ApiMarketOperation
          | ApiMarketBatchOperation
          | undefined;
        if (!operation || operation.profile_id !== profileId) return;
        const previous = activities.find(
          (activity) => activity.id === operation.id
        );
        const changed = recordMarketActivity(operation);
        if (!changed || !SETTLED.has(operation.state)) return;
        invalidateMarketSettlement(client);
        if (previous && PENDING.has(previous.state))
          setCompleted({ ...previous, state: operation.state });
      }),
    [profileId, client, activities]
  );
  const pending = activities.filter((a) => PENDING.has(a.state));
  const completion = completed?.profileId === profileId ? completed : null;
  const latest = pending[0] ?? completion;
  const noticeId = latest
    ? `${latest.profileId}:${latest.id}:${latest.state}`
    : undefined;
  if (
    !latest ||
    !noticeId ||
    dismissed === noticeId ||
    pathname === "/collect/orders"
  )
    return null;
  const submitted = pending.every(
    (a) => a.state === "SUBMITTED" || a.state === "MINED"
  );
  let titleKey:
    | ReturnType<typeof completionTitle>
    | "collect.activity.processing"
    | "collect.activity.checking" = completionTitle(latest);
  let descriptionKey:
    | "collect.activity.outcomeReady"
    | "collect.activity.receiptReady"
    | "collect.activity.leave"
    | "collect.activity.recover" =
    latest.state === "FAILED" || latest.state === "EXPIRED"
      ? "collect.activity.outcomeReady"
      : "collect.activity.receiptReady";
  if (pending.length > 0) {
    titleKey = submitted
      ? "collect.activity.processing"
      : "collect.activity.checking";
    descriptionKey = submitted
      ? "collect.activity.leave"
      : "collect.activity.recover";
  }
  return (
    <aside
      aria-label={t(locale, "collect.activity.title")}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setInteracting(false);
      }}
      className="tailwind-scope tw-fixed tw-bottom-24 tw-right-4 tw-z-40 tw-w-[min(22rem,calc(100vw-2rem))] tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4 tw-text-iron-100 tw-shadow-xl"
    >
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <p role="status" className="tw-m-0 tw-text-sm tw-font-medium">
          {t(locale, titleKey)}
        </p>
        <button
          type="button"
          aria-label={t(locale, "collect.activity.dismiss")}
          onClick={() => setDismissed(noticeId)}
          className="-tw-m-2 tw-flex tw-size-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          ×
        </button>
      </div>
      <p className="tw-mb-3 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
        {t(locale, descriptionKey)}
      </p>
      <Link
        href={`/collect/orders?operation=${encodeURIComponent(latest.id)}&kind=${encodeURIComponent(latest.kind)}`}
        className="tw-rounded-sm tw-text-sm tw-text-primary-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        {t(locale, "collect.activity.viewOrders")}
      </Link>
    </aside>
  );
}
