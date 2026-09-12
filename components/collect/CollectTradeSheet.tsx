"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatDate } from "@/i18n/format";
import CollectPurchaseSummary from "./CollectPurchaseSummary";
import {
  isFreshMarketReviewExpiry,
  isValidMarketReviewExpiry,
} from "./market-review-expiry";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type {
  CollectReviewFact,
  CollectTradeReview,
  CollectTradeStage,
} from "./collect.types";

export type CollectTradePresentation = "dialog" | "contents";

interface CollectTradeSheetProps {
  readonly open: boolean;
  readonly review: CollectTradeReview | null;
  readonly stage: CollectTradeStage;
  readonly title?: string | undefined;
  readonly form?: ReactNode;
  readonly recoveryAction?: ReactNode;
  readonly message?: string | undefined;
  readonly onClose: () => void;
  readonly onRefresh: () => void | Promise<void>;
  readonly onConfirm: (reviewId: string, revision: string) => Promise<void>;
  readonly presentation?: CollectTradePresentation;
  readonly compact?: boolean;
}

export function CollectTradeDialog({
  open,
  title,
  onClose,
  children,
}: Pick<CollectTradeSheetProps, "open" | "title" | "onClose"> & {
  readonly children: ReactNode;
}) {
  const locale = useBrowserLocale();
  return (
    <MobileWrapperDialog
      title={title ?? t(locale, "collect.trade.title")}
      isOpen={open}
      onClose={onClose}
      tabletModal
      hideOnDesktopHover={false}
      enableDragToClose={false}
      maxWidthClass="md:tw-max-w-xl"
      focusTitleOnOpen
    >
      {children}
    </MobileWrapperDialog>
  );
}

const PENDING_STAGES: readonly CollectTradeStage[] = [
  "preparing",
  "approval",
  "signature",
  "publishing",
  "submitted",
  "awaiting_signatures",
  "reconciling",
];

function Facts({ facts }: { readonly facts: readonly CollectReviewFact[] }) {
  return (
    <dl className="tw-m-0 tw-space-y-3">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-5 tw-gap-y-1"
        >
          <dt className="tw-text-sm tw-font-normal tw-text-iron-400">
            {fact.label}
          </dt>
          <dd className="tw-m-0 tw-max-w-full tw-break-words tw-text-right tw-text-sm tw-font-medium tw-tabular-nums tw-text-iron-100 [overflow-wrap:anywhere]">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function useReviewExpiry(expiresAt: number | null | undefined, open: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!open || !isValidMarketReviewExpiry(expiresAt)) return;
    const initialTimer = globalThis.setTimeout(() => setNow(Date.now()), 0);
    const timer = globalThis.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      globalThis.clearTimeout(initialTimer);
      globalThis.clearInterval(timer);
    };
  }, [expiresAt, open]);
  return !isFreshMarketReviewExpiry(expiresAt, now);
}

export default function CollectTradeSheet(props: CollectTradeSheetProps) {
  const locale = useBrowserLocale();
  const expired = useReviewExpiry(props.review?.expiresAt, props.open);
  const [confirming, setConfirming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [localError, setLocalError] = useState(false);
  const inFlight = useRef(false);
  const { review } = props;
  // A purchase is re-quoted and compared before opening the wallet. Its prior
  // positive deadline limits execution freshness, not time spent reading.
  const needsRefresh =
    expired &&
    (review?.action !== "buy" || !isValidMarketReviewExpiry(review.expiresAt));
  const pending = PENDING_STAGES.includes(props.stage);
  const canConfirm =
    review !== null &&
    props.stage === "review" &&
    !review.disabledReason &&
    !needsRefresh &&
    !confirming &&
    !refreshing;
  let refreshMessage = t(locale, "collect.trade.refreshRequired");
  if (isValidMarketReviewExpiry(review?.expiresAt)) {
    refreshMessage = t(locale, "collect.trade.expired");
  }
  if (review?.purchase) {
    refreshMessage = t(locale, "collect.review.quoteRefreshRequired");
  }
  const refreshAction = review?.purchase
    ? t(locale, "collect.review.refreshQuote")
    : t(locale, "collect.trade.refresh");

  const refresh = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    setLocalError(false);
    try {
      await props.onRefresh();
    } catch {
      setLocalError(true);
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  };

  const confirm = async () => {
    if (!canConfirm || inFlight.current) return;
    if (
      !isFreshMarketReviewExpiry(review.expiresAt) &&
      (review.action !== "buy" || !isValidMarketReviewExpiry(review.expiresAt))
    ) {
      await refresh();
      return;
    }
    inFlight.current = true;
    setConfirming(true);
    setLocalError(false);
    try {
      await props.onConfirm(review.id, review.revision);
    } catch {
      setLocalError(true);
    } finally {
      inFlight.current = false;
      setConfirming(false);
    }
  };

  const content = (
    <div
      className={
        props.compact
          ? "tw-w-full tw-space-y-3 tw-text-iron-100"
          : "tw-space-y-5 tw-px-4 tw-text-iron-100 md:tw-px-6"
      }
    >
      {review ? (
        <>
          {!props.compact && !review.purchase && (
            <div className="tw-flex tw-items-center tw-gap-4">
              {review.media !== undefined && review.media !== null && (
                <div className="tw-relative tw-flex tw-size-20 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 [&_img]:tw-max-h-full [&_img]:tw-object-contain">
                  {review.media}
                </div>
              )}
              <div className="tw-min-w-0">
                <p className="tw-mb-1 tw-mt-0 tw-text-xs tw-font-semibold tw-text-primary-300">
                  {t(locale, `collect.action.${review.action}`)}
                </p>
                <h2 className="tw-m-0 tw-break-words tw-text-lg tw-font-semibold tw-leading-6">
                  {review.title}
                </h2>
              </div>
            </div>
          )}
          {review.purchase ? (
            <CollectPurchaseSummary
              purchase={review.purchase}
              title={review.title}
              media={review.media}
            />
          ) : (
            <>
              <Facts facts={review.facts} />
              <div
                className={
                  props.compact
                    ? "tw-space-y-1"
                    : "tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4"
                }
              >
                <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
                  {t(locale, `collect.review.total.${review.action}`)}
                </p>
                <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
                  {review.totalDescription}
                </p>
                <p className="tw-mb-0 tw-mt-1 tw-text-2xl tw-font-semibold tw-tabular-nums">
                  {review.totalLabel}
                </p>
              </div>
            </>
          )}
          {(review.action === "list" || review.action === "offer") && (
            <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
              {t(locale, "collect.trade.orderWarning")}
            </p>
          )}
          {review.action === "cancel" && (
            <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
              {t(locale, "collect.trade.cancelWarning")}
            </p>
          )}
          {review.warnings.length > 0 && (
            <ul className="tw-m-0 tw-space-y-2 tw-pl-4 tw-text-sm tw-leading-6 tw-text-iron-300">
              {review.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          {!review.purchase && review.technicalFacts.length > 0 && (
            <details>
              <summary className="tw-cursor-pointer tw-rounded tw-py-2 tw-text-sm tw-font-medium tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
                {t(locale, "collect.trade.details")}
              </summary>
              <div className="tw-pt-3">
                <Facts facts={review.technicalFacts} />
              </div>
            </details>
          )}
          {!review.purchase && isValidMarketReviewExpiry(review.expiresAt) && (
            <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
              {t(locale, "collect.trade.expiry", {
                time: formatDate(locale, review.expiresAt, {
                  dateStyle: "medium",
                  timeStyle: "medium",
                }),
              })}
            </p>
          )}
          {needsRefresh && !confirming && props.stage === "review" && (
            <p
              role="status"
              className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300"
            >
              {refreshMessage}
            </p>
          )}
          {review.disabledReason && (
            <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
              {review.disabledReason}
            </p>
          )}
        </>
      ) : (
        props.form
      )}
      {props.stage !== "review" && (
        <div role="status" className="tw-rounded-lg tw-bg-iron-800/70 tw-p-4">
          <p className="tw-m-0 tw-text-sm tw-font-semibold">
            {t(locale, `collect.trade.stage.${props.stage}`)}
          </p>
          {pending && (
            <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-300">
              {t(locale, "collect.trade.pendingNote")}
            </p>
          )}
        </div>
      )}
      {(Boolean(props.message) || localError) && (
        <p
          role="alert"
          className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300"
        >
          {props.message ?? t(locale, "collect.trade.stage.failed")}
        </p>
      )}
      {review && props.stage === "review" && (
        <div className="tw-sticky tw-bottom-0 tw-bg-iron-950 tw-py-3">
          {needsRefresh && !confirming ? (
            <Button
              variant={review.purchase ? "action" : "secondary"}
              size="lg"
              fullWidth
              disabled={refreshing}
              loading={refreshing}
              onClick={() => {
                void refresh();
              }}
            >
              {refreshing
                ? t(locale, "collect.trade.refreshing")
                : refreshAction}
            </Button>
          ) : (
            <Button
              variant="action"
              size="lg"
              fullWidth
              disabled={!canConfirm}
              loading={confirming}
              onClick={() => {
                void confirm();
              }}
            >
              {props.compact && review.action === "buy" && !review.purchase
                ? t(locale, "collect.buy.atPrice", { price: review.totalLabel })
                : t(locale, "collect.trade.continue")}
            </Button>
          )}
        </div>
      )}
      {props.compact &&
        review &&
        (props.stage === "review" || props.stage === "confirmed") && (
          <Button
            variant="secondary"
            size="sm"
            disabled={confirming || refreshing}
            onClick={props.onClose}
          >
            {t(
              locale,
              props.stage === "confirmed"
                ? "collect.buy.doneDelivery"
                : "collect.buy.editPurchase"
            )}
          </Button>
        )}
      {props.recoveryAction}
    </div>
  );
  if (props.presentation === "contents") return content;
  return (
    <CollectTradeDialog
      open={props.open}
      title={props.title}
      onClose={props.onClose}
    >
      {content}
    </CollectTradeDialog>
  );
}
