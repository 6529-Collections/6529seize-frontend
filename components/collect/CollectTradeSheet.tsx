"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useRef, useState, type ReactNode } from "react";
import CollectPurchaseSummary from "./CollectPurchaseSummary";
import CollectOrderSummary from "./CollectOrderSummary";
import styles from "./marketplace-font.module.css";
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
      <div className={styles["surface"]}>{children}</div>
    </MobileWrapperDialog>
  );
}
function Facts({ facts }: { readonly facts: readonly CollectReviewFact[] }) {
  return (
    <dl className="tw-m-0 tw-space-y-3">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-5 tw-gap-y-1"
        >
          <dt className="tw-text-[13px] tw-font-normal tw-leading-5 tw-text-iron-400">
            {fact.label}
          </dt>
          <dd className="tw-m-0 tw-max-w-full tw-text-right tw-text-sm tw-font-normal tw-tabular-nums tw-leading-5 tw-text-iron-100 [overflow-wrap:anywhere]">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
/** Execution refreshes and compares terms before any wallet request. */
export default function CollectTradeSheet(props: CollectTradeSheetProps) {
  const locale = useBrowserLocale();
  const [confirming, setConfirming] = useState(false);
  const [localError, setLocalError] = useState(false);
  const inFlight = useRef(false);
  const { review } = props;
  const canConfirm =
    review !== null &&
    props.stage === "review" &&
    !review.disabledReason &&
    !confirming;
  const confirm = async () => {
    if (!canConfirm || inFlight.current) return;
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
  const message =
    props.message ??
    (localError ? t(locale, "collect.trade.stage.failed") : undefined);
  const showMessage =
    Boolean(message) &&
    !["confirmed", "live"].includes(props.stage) &&
    !(
      props.stage === "reconciling" &&
      message === t(locale, "collect.trade.broadcastUnknown")
    );
  const actionSlot = (
    <div className="tw-space-y-3">
      {review && review.warnings.length > 0 && (
        <ul className="tw-m-0 tw-space-y-2 tw-pl-4 tw-text-[13px] tw-leading-5 tw-text-iron-300">
          {review.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      {review?.disabledReason && (
        <p className="tw-m-0 tw-text-[13px] tw-leading-5 tw-text-iron-300">
          {review.disabledReason}
        </p>
      )}
      {props.stage !== "review" && (
        <div
          role="status"
          className="tw-rounded-lg tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-leading-5"
        >
          {t(locale, `collect.trade.stage.${props.stage}`)}
        </div>
      )}
      {showMessage && (
        <p
          role="alert"
          className="tw-m-0 tw-text-[13px] tw-leading-5 tw-text-iron-300"
        >
          {message}
        </p>
      )}
      {review && props.stage === "review" && (
        <Button
          variant="action"
          size="lg"
          fullWidth
          disabled={!canConfirm}
          loading={confirming}
          className="tw-min-h-12 tw-text-sm tw-font-medium"
          onClick={() => {
            void confirm();
          }}
        >
          {t(locale, "collect.trade.continue")}
        </Button>
      )}
      {props.compact &&
        review &&
        (props.stage === "review" || props.stage === "confirmed") && (
          <Button
            variant="secondary"
            size="sm"
            className="tw-min-h-11 tw-text-[13px] tw-font-normal"
            disabled={confirming}
            onClick={props.onClose}
          >
            {t(
              locale,
              props.stage === "confirmed"
                ? "collect.buy.doneDelivery"
                : `collect.review.edit.${review.action}`
            )}
          </Button>
        )}
      {props.recoveryAction}
    </div>
  );
  const renderReview = () => {
    if (!review)
      return (
        <>
          {props.form}
          {actionSlot}
        </>
      );
    if (review.purchase)
      return (
        <CollectPurchaseSummary
          purchase={review.purchase}
          title={review.title}
          media={review.media}
          actionSlot={actionSlot}
        />
      );
    if (review.orderReview)
      return <CollectOrderSummary review={review} actionSlot={actionSlot} />;
    return (
      <>
        {!props.compact && (
          <div className="tw-flex tw-items-center tw-gap-3">
            {review.media !== null && review.media !== undefined && (
              <div className="tw-relative tw-flex tw-size-16 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 [&_img]:tw-max-h-full [&_img]:tw-object-contain">
                {review.media}
              </div>
            )}
            <div className="tw-min-w-0">
              <h2 className="tw-m-0 tw-break-words tw-text-lg tw-font-semibold tw-leading-6 tw-tracking-tight">
                {review.title}
              </h2>
              <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-400">
                {t(locale, `collect.action.${review.action}`)}
              </p>
            </div>
          </div>
        )}
        <Facts facts={review.facts} />
        <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5">
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            {t(locale, `collect.review.total.${review.action}`)}
          </p>
          <p className="tw-m-0 tw-text-2xl tw-font-medium tw-tabular-nums tw-tracking-tight">
            {review.totalLabel}
          </p>
        </div>
        {(review.action === "list" || review.action === "offer") && (
          <p className="tw-m-0 tw-text-[13px] tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.trade.orderWarning")}
          </p>
        )}
        {review.action === "cancel" && (
          <p className="tw-m-0 tw-text-[13px] tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.trade.cancelWarning")}
          </p>
        )}
        {actionSlot}
        {review.technicalFacts.length > 0 && (
          <details className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-2">
            <summary className="tw-cursor-pointer tw-rounded tw-py-3 tw-text-sm tw-font-medium tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
              {t(locale, "collect.trade.details")}
            </summary>
            <div className="tw-py-3">
              <Facts facts={review.technicalFacts} />
            </div>
          </details>
        )}
      </>
    );
  };
  const content = (
    <div
      className={`${styles["surface"] ?? ""} tw-w-full tw-space-y-6 tw-text-iron-100 ${props.compact ? "" : "tw-px-5 md:tw-px-7"}`}
    >
      {renderReview()}
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
