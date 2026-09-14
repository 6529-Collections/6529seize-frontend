"use client";

import Button from "@/components/utils/button/Button";
import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CollectArtworkView, CollectTradeAction } from "./collect.types";
import CollectTradeActions from "./CollectTradeActions";
import {
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useId } from "react";

export interface CollectArtworkSelection {
  readonly selected: boolean;
  readonly pending?: boolean;
  readonly disabledReason?: string | undefined;
  readonly onToggle: () => void;
}

export default function CollectArtworkCard({
  artwork,
  locale,
  onTrade,
  selection,
}: {
  readonly artwork: CollectArtworkView;
  readonly locale: SupportedLocale;
  readonly onTrade: (artworkId: string, action: CollectTradeAction) => void;
  readonly selection?: CollectArtworkSelection | undefined;
}) {
  const selectionReasonId = useId();
  let selectionLabel: Parameters<typeof t>[1] = "collect.selection.add";
  if (selection?.selected) selectionLabel = "collect.selection.selected";
  if (selection?.pending) selectionLabel = "collect.selection.processing";
  let selectionAccessibleLabel: Parameters<typeof t>[1] = selection?.selected
    ? "collect.selection.removeArtwork"
    : "collect.selection.addArtwork";
  if (selection?.pending)
    selectionAccessibleLabel = "collect.selection.processingArtwork";
  return (
    <article className="tw-flex tw-min-w-0 tw-flex-col tw-@container/artwork">
      <Link
        href={artwork.href}
        aria-label={t(locale, "collect.artworkLink", { title: artwork.title })}
        className="tw-group tw-block tw-text-iron-100 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <div className="tw-relative tw-flex tw-aspect-square tw-items-center tw-justify-center tw-overflow-hidden tw-bg-iron-900 [&_img]:tw-max-h-full [&_img]:tw-object-contain">
          {artwork.media}
        </div>
        <div className="tw-space-y-1 tw-pb-2 tw-pt-3">
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {artwork.tokenLabel}
          </p>
          <h2 className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100 group-hover:tw-text-white">
            {artwork.title}
          </h2>
          {artwork.artist && (
            <p className="tw-m-0 tw-break-words tw-text-xs tw-leading-5 tw-text-iron-400">
              {artwork.artist}
            </p>
          )}
        </div>
      </Link>
      <div className="tw-mt-auto tw-space-y-2 tw-pb-4">
        {artwork.valueMetric && (
          <div className="tw-min-w-0 tw-space-y-1 tw-pb-1 [overflow-wrap:anywhere]">
            <p className="tw-m-0 tw-text-lg tw-font-semibold tw-tabular-nums tw-leading-6 tw-tracking-tight tw-text-iron-50 sm:tw-text-xl">
              {artwork.valueMetric.value}
            </p>
            <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300">
              {artwork.valueMetric.label}
            </p>
          </div>
        )}
        {artwork.ownedLabel !== null && (
          <p className="tw-m-0 tw-text-xs tw-text-iron-300">
            {artwork.ownedLabel}
          </p>
        )}
        {artwork.priceLabel && (
          <div className="tw-flex tw-flex-col tw-flex-wrap tw-items-start tw-gap-2 @[16rem]/artwork:tw-flex-row @[16rem]/artwork:tw-justify-between">
            <div className="tw-min-w-0 tw-max-w-full [overflow-wrap:anywhere]">
              {artwork.priceExactLabel &&
              artwork.priceExactLabel !== artwork.priceLabel ? (
                <details className="tw-group/price">
                  <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-gap-1 tw-text-sm tw-font-medium tw-tabular-nums tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden">
                    <span>{artwork.priceLabel}</span>
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="tw-size-3 tw-shrink-0 tw-text-iron-400 group-open/price:tw-rotate-180"
                    />
                  </summary>
                  <p className="tw-m-0 tw-pb-1 tw-text-xs tw-tabular-nums tw-leading-5 tw-text-iron-300">
                    <span className="tw-block tw-text-iron-400">
                      {t(locale, "collect.review.exactAmounts")}
                    </span>
                    <span>{artwork.priceExactLabel}</span>
                  </p>
                </details>
              ) : (
                <p className="tw-m-0 tw-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-tabular-nums tw-text-iron-100">
                  {artwork.priceLabel}
                </p>
              )}
              {artwork.priceDescription && (
                <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
                  {artwork.priceDescription}
                </p>
              )}
              {artwork.sourceLabel && (
                <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-400">
                  {artwork.sourceLabel}
                </p>
              )}
            </div>
            {selection && (
              <Button
                variant={selection.selected ? "secondary" : "action"}
                size="sm"
                aria-pressed={selection.selected}
                aria-label={t(locale, selectionAccessibleLabel, {
                  title: artwork.title,
                })}
                disabled={Boolean(selection.disabledReason)}
                aria-describedby={
                  selection.disabledReason ? selectionReasonId : undefined
                }
                title={selection.disabledReason}
                onClick={selection.onToggle}
                className="tw-ml-auto tw-min-h-11 tw-max-w-full tw-shrink-0 tw-font-medium"
              >
                {selection.selected ? (
                  <CheckIcon aria-hidden="true" className="tw-size-4" />
                ) : (
                  <PlusIcon aria-hidden="true" className="tw-size-4" />
                )}
                <span>{t(locale, selectionLabel)}</span>
              </Button>
            )}
            {selection?.disabledReason && (
              <span id={selectionReasonId} className="tw-sr-only">
                {selection.disabledReason}
              </span>
            )}
          </div>
        )}
        <CollectTradeActions
          actions={
            selection
              ? artwork.actions.filter(({ action }) => action !== "buy")
              : artwork.actions
          }
          title={artwork.title}
          locale={locale}
          onTrade={(action) => onTrade(artwork.id, action)}
        />
      </div>
    </article>
  );
}
