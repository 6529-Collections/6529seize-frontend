"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { formatCollectReviewWei } from "./collect-review-amounts";
import { formatCollectReviewCap } from "./collect-review-presentation";

export function CollectReviewAmountRow({
  label,
  children,
  prominent = false,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly prominent?: boolean;
}) {
  return (
    <div
      className={
        prominent
          ? "tw-grid tw-grid-cols-[minmax(0,1fr)_minmax(0,2fr)] tw-items-baseline tw-gap-x-3 tw-gap-y-1"
          : "tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-4 tw-gap-y-1"
      }
    >
      <dt
        className={
          prominent
            ? "tw-text-sm tw-font-medium tw-text-iron-100"
            : "tw-text-[13px] tw-text-iron-400"
        }
      >
        {label}
      </dt>
      <dd
        className={`tw-m-0 tw-min-w-0 tw-max-w-full tw-text-right tw-tabular-nums tw-text-iron-100 [overflow-wrap:anywhere] ${prominent ? "tw-text-[22px] tw-font-medium tw-leading-tight tw-tracking-tight min-[380px]:tw-text-2xl" : "tw-text-sm tw-font-normal"}`}
      >
        {children}
      </dd>
    </div>
  );
}

export function CollectReviewMoney({
  wei,
  currency,
  cap = false,
  capDecimals = 8,
}: {
  readonly wei: string;
  readonly currency: "ETH" | "WETH";
  readonly cap?: boolean;
  readonly capDecimals?: number;
}) {
  const locale = useBrowserLocale();
  return (
    <span className="tw-tabular-nums">
      {cap && (
        <>
          <span className="tw-sr-only">
            {t(locale, "collect.review.atMost")}{" "}
          </span>
          <span aria-hidden="true" className="tw-mr-1 tw-text-iron-400">
            ≤
          </span>
        </>
      )}
      {cap
        ? formatCollectReviewCap(locale, wei, capDecimals)
        : formatCollectReviewWei(locale, wei)}{" "}
      <span className="tw-text-xs tw-font-normal tw-text-iron-400">
        {currency}
      </span>
    </span>
  );
}

export function CollectReviewDisclosure({
  label,
  children,
  nested = false,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly nested?: boolean;
}) {
  return (
    <details
      className={
        nested
          ? "tw-min-w-0 [&[open]>summary>svg]:tw-rotate-180"
          : "tw-min-w-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 [&[open]>summary>svg]:tw-rotate-180"
      }
    >
      <summary
        className={`tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-rounded-md focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden ${nested ? "tw-py-2 tw-text-xs tw-text-primary-300" : "tw-py-4 tw-text-sm tw-font-medium tw-text-iron-200"}`}
      >
        {label}
        <ChevronDownIcon
          aria-hidden="true"
          className="tw-size-3.5 tw-shrink-0"
        />
      </summary>
      <div
        className={
          nested
            ? "tw-space-y-3 tw-rounded-lg tw-bg-white/[0.03] tw-p-3"
            : "tw-space-y-4 tw-pb-4"
        }
      >
        {children}
      </div>
    </details>
  );
}
