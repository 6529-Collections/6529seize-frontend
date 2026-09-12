"use client";

import Button from "@/components/utils/button/Button";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useId, useState } from "react";
import CollectBatchDestination from "./CollectBatchDestination";
import CollectBatchReviewItem from "./CollectBatchReviewItem";
import {
  collectBatchReviewIssue,
  collectBatchReviewScope,
  collectBatchEthAmount,
} from "./collect-batch-review.helpers";
import type {
  CollectBatchAllocation,
  CollectBatchDraft,
} from "./collect-batch.types";
import { collectListingKey } from "./collect-buy.helpers";
import { defaultCollectRecipient } from "./collect-recipient.helpers";
import {
  collectSelectionTotal,
  type CollectSelectedListing,
} from "./collect-selection.helpers";

interface Props {
  readonly items: readonly CollectSelectedListing[];
  readonly profile: ApiIdentity | null;
  readonly payingWallet?: string;
  readonly initialRecipient?: string;
  readonly loading?: boolean;
  readonly error?: string | null | undefined;
  readonly disabledReason?: string | null | undefined;
  readonly maxItems?: number;
  readonly maxAllocations?: number;
  readonly onPrepare: (draft: CollectBatchDraft) => void;
  readonly onClose: () => void;
}

export default function CollectBatchReviewForm(props: Props) {
  return <BatchReviewDraft key={collectBatchReviewScope(props)} {...props} />;
}

function BatchReviewDraft({
  items,
  profile,
  payingWallet,
  initialRecipient,
  loading = false,
  error,
  disabledReason,
  maxItems = 128,
  maxAllocations = 256,
  onPrepare,
  onClose,
}: Props) {
  const locale = useBrowserLocale();
  const id = useId();
  const [selected, setSelected] = useState(
    () => new Set(items.map((item) => collectListingKey(item.order)))
  );
  const [delivery, setDelivery] = useState<CollectBatchAllocation>(() => ({
    recipient:
      initialRecipient ?? defaultCollectRecipient(profile, payingWallet),
    acknowledgeExternalRecipient: false,
    quantity: "1",
  }));
  const [overrides, setOverrides] = useState<
    Readonly<Record<string, readonly CollectBatchAllocation[]>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const allocationsFor = (item: CollectSelectedListing) =>
    overrides[collectListingKey(item.order)] ?? [
      { ...delivery, quantity: item.quantity },
    ];
  const chosen = items.filter((item) =>
    selected.has(collectListingKey(item.order))
  );
  const draft: CollectBatchDraft = {
    items: chosen.map((item) => ({
      ...item,
      allocations: allocationsFor(item),
    })),
  };
  const issue = collectBatchReviewIssue(
    draft.items,
    profile,
    maxItems,
    maxAllocations
  );
  const total = collectSelectionTotal(chosen);
  const allocationCount = draft.items.reduce(
    (count, item) => count + item.allocations.length,
    0
  );
  const all = chosen.length === items.length && items.length > 0;
  const showIssue =
    submitted || issue === "limit" || issue === "allocationLimit";
  const issueText =
    issue !== null && showIssue
      ? t(locale, `collect.batchReview.invalid.${issue}`, {
          max: formatNumber(locale, maxItems),
          allocations: formatNumber(locale, maxAllocations),
        })
      : null;
  return (
    <form
      aria-label={t(locale, "collect.batchReview.title")}
      className="tw-space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (issue === null && total !== null && !loading && !disabledReason)
          onPrepare(draft);
      }}
    >
      <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
        {t(locale, "collect.batchReview.description")}
      </p>
      <fieldset
        disabled={loading}
        className="tw-m-0 tw-min-w-0 tw-space-y-1 tw-border-0 tw-p-0"
      >
        <legend className="tw-mb-1 tw-text-xs tw-font-medium tw-text-iron-200">
          {t(locale, "collect.batchReview.defaultDelivery")}
        </legend>
        <CollectBatchDestination
          allocation={delivery}
          profile={profile}
          payingWallet={payingWallet}
          disabled={loading}
          onChange={setDelivery}
        />
      </fieldset>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-pb-2">
        <label className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-3 tw-text-xs tw-text-iron-200">
          <input
            type="checkbox"
            checked={all}
            disabled={loading || items.length === 0}
            ref={(element) => {
              if (element) element.indeterminate = chosen.length > 0 && !all;
            }}
            onChange={() =>
              setSelected(
                all
                  ? new Set()
                  : new Set(items.map((item) => collectListingKey(item.order)))
              )
            }
            className="tw-size-4 tw-accent-primary-500"
          />
          {t(locale, "collect.batchReview.selectAll")}
        </label>
        <span
          aria-live="polite"
          className="tw-text-xs tw-tabular-nums tw-text-iron-400"
        >
          {t(locale, "collect.batchReview.selected", {
            selected: formatNumber(locale, chosen.length),
            total: formatNumber(locale, items.length),
          })}
        </span>
      </div>
      <ul className="tw-m-0 tw-list-none tw-p-0">
        {items.map((item) => {
          const key = collectListingKey(item.order);
          return (
            <CollectBatchReviewItem
              key={key}
              item={item}
              selected={selected.has(key)}
              allocations={allocationsFor(item)}
              customized={overrides[key] !== undefined}
              profile={profile}
              payingWallet={payingWallet}
              disabled={loading}
              canAddAllocation={allocationCount < maxAllocations}
              onToggle={() =>
                setSelected((current) => {
                  const next = new Set(current);
                  if (next.has(key)) next.delete(key);
                  else next.add(key);
                  return next;
                })
              }
              onChange={(allocations) =>
                setOverrides((current) => ({ ...current, [key]: allocations }))
              }
              onReset={() =>
                setOverrides((current) => {
                  const next = { ...current };
                  delete next[key];
                  return next;
                })
              }
            />
          );
        })}
      </ul>
      {(issueText || error) && (
        <p
          id={`${id}-error`}
          role="alert"
          className="tw-m-0 tw-text-xs tw-leading-5 tw-text-red"
        >
          {issueText ?? error}
        </p>
      )}
      {disabledReason && (
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300">
          {disabledReason}
        </p>
      )}
      <div className="tw-space-y-3 tw-pt-2">
        <div aria-live="polite" className="tw-space-y-1">
          <p className="tw-m-0 tw-text-sm tw-font-medium tw-tabular-nums tw-text-iron-100">
            {total === null
              ? t(locale, "collect.buy.listingChanged")
              : t(locale, "collect.batchReview.estimate", {
                  price: collectBatchEthAmount(locale, total),
                })}
          </p>
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.batchReview.nextStep")}
          </p>
        </div>
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <Button
            type="submit"
            variant="action"
            size="lg"
            loading={loading}
            disabled={
              issue !== null || total === null || Boolean(disabledReason)
            }
            aria-describedby={issueText || error ? `${id}-error` : undefined}
          >
            {t(locale, "collect.batchReview.prepare")}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            disabled={loading}
            onClick={onClose}
          >
            {t(locale, "collect.batchReview.back")}
          </Button>
        </div>
      </div>
    </form>
  );
}
