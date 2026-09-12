"use client";

import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CollectArtworkView, CollectTradeAction } from "./collect.types";
import CollectTradeActions from "./CollectTradeActions";
import { CheckIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useId } from "react";

export interface CollectArtworkSelection {
  readonly selected: boolean;
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
  return (
    <article className="tw-flex tw-min-w-0 tw-flex-col">
      <Link
        href={artwork.href}
        aria-label={t(locale, "collect.artworkLink", { title: artwork.title })}
        className="tw-group tw-block tw-text-iron-100 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <div className="tw-relative tw-flex tw-aspect-square tw-items-center tw-justify-center tw-overflow-hidden tw-bg-iron-900 [&_img]:tw-max-h-full [&_img]:tw-object-contain">
          {artwork.media}
        </div>
        <div className="tw-space-y-1 tw-pb-2 tw-pt-4">
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {artwork.tokenLabel}
          </p>
          <h2 className="tw-m-0 tw-break-words tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100 group-hover:tw-text-white">
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
        {artwork.ownedLabel !== null && (
          <p className="tw-m-0 tw-text-xs tw-text-iron-300">
            {artwork.ownedLabel}
          </p>
        )}
        {artwork.priceLabel && (
          <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-2">
            <div className="tw-min-w-0 tw-max-w-full [overflow-wrap:anywhere]">
              <p className="tw-m-0 tw-text-sm tw-font-semibold tw-tabular-nums tw-text-iron-100">
                {artwork.priceLabel}
              </p>
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
              <button
                type="button"
                aria-pressed={selection.selected}
                aria-label={t(
                  locale,
                  selection.selected
                    ? "collect.selection.removeArtwork"
                    : "collect.selection.addArtwork",
                  { title: artwork.title }
                )}
                disabled={
                  Boolean(selection.disabledReason) && !selection.selected
                }
                aria-describedby={
                  selection.disabledReason ? selectionReasonId : undefined
                }
                title={selection.disabledReason}
                onClick={selection.onToggle}
                className="tw-ml-auto tw-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/15 tw-bg-transparent tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-white/40 desktop-hover:hover:tw-text-white"
              >
                {selection.selected ? (
                  <CheckIcon aria-hidden="true" className="tw-size-4" />
                ) : (
                  <PlusIcon aria-hidden="true" className="tw-size-4" />
                )}
              </button>
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
