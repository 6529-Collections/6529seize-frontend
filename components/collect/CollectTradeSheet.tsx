"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatDate } from "@/i18n/format";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type {
  CollectReviewFact,
  CollectTradeReview,
  CollectTradeStage,
} from "./collect.types";

interface CollectTradeSheetProps {
  readonly open: boolean;
  readonly review: CollectTradeReview | null;
  readonly stage: CollectTradeStage;
  readonly title?: string | undefined;
  readonly form?: ReactNode;
  readonly recoveryAction?: ReactNode;
  readonly message?: string | undefined;
  readonly onClose: () => void;
  readonly onRefresh: () => void;
  readonly onConfirm: (reviewId: string, revision: string) => Promise<void>;
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
    if (!open || expiresAt === null || expiresAt === undefined) return;
    const initialTimer = globalThis.setTimeout(() => setNow(Date.now()), 0);
    const timer = globalThis.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      globalThis.clearTimeout(initialTimer);
      globalThis.clearInterval(timer);
    };
  }, [expiresAt, open]);
  return expiresAt !== null && expiresAt !== undefined && now >= expiresAt;
}

export default function CollectTradeSheet(props: CollectTradeSheetProps) {
  const locale = useBrowserLocale();
  const expired = useReviewExpiry(props.review?.expiresAt, props.open);
  const [confirming, setConfirming] = useState(false);
  const [localError, setLocalError] = useState(false);
  const inFlight = useRef(false);
  const { review } = props;
  const pending = PENDING_STAGES.includes(props.stage);
  const canConfirm =
    review !== null &&
    props.stage === "review" &&
    !review.disabledReason &&
    !expired &&
    !confirming;

  const confirm = async () => {
    if (!canConfirm || inFlight.current) return;
    if (review.expiresAt !== null && Date.now() >= review.expiresAt) {
      props.onRefresh();
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

  return (
    <MobileWrapperDialog
      title={props.title ?? t(locale, "collect.trade.title")}
      isOpen={props.open}
      onClose={props.onClose}
      tabletModal
      hideOnDesktopHover={false}
      enableDragToClose={false}
      maxWidthClass="md:tw-max-w-xl"
      focusTitleOnOpen
    >
      <div className="tw-space-y-5 tw-px-4 tw-text-iron-100 md:tw-px-6">
        {review ? (
          <>
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
            <Facts facts={review.facts} />
            <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4">
              <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
                {review.totalDescription}
              </p>
              <p className="tw-mb-0 tw-mt-1 tw-text-2xl tw-font-semibold tw-tabular-nums">
                {review.totalLabel}
              </p>
            </div>
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
            {review.technicalFacts.length > 0 && (
              <details>
                <summary className="tw-cursor-pointer tw-rounded tw-py-2 tw-text-sm tw-font-medium tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
                  {t(locale, "collect.trade.details")}
                </summary>
                <div className="tw-pt-3">
                  <Facts facts={review.technicalFacts} />
                </div>
              </details>
            )}
            {review.expiresAt !== null && (
              <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
                {t(locale, "collect.trade.expiry", {
                  time: formatDate(locale, review.expiresAt, {
                    dateStyle: "medium",
                    timeStyle: "medium",
                  }),
                })}
              </p>
            )}
            {expired && props.stage === "review" && (
              <p
                role="status"
                className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300"
              >
                {t(locale, "collect.trade.expired")}
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
            {expired ? (
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={props.onRefresh}
              >
                {t(locale, "collect.trade.refresh")}
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
                {t(locale, "collect.trade.continue")}
              </Button>
            )}
          </div>
        )}
        {props.recoveryAction}
      </div>
    </MobileWrapperDialog>
  );
}
