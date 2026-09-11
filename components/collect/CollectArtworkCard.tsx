"use client";

import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CollectArtworkView, CollectTradeAction } from "./collect.types";
import CollectTradeActions from "./CollectTradeActions";

export default function CollectArtworkCard({
  artwork,
  locale,
  onTrade,
}: {
  readonly artwork: CollectArtworkView;
  readonly locale: SupportedLocale;
  readonly onTrade: (artworkId: string, action: CollectTradeAction) => void;
}) {
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
          <div>
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
        )}
        <CollectTradeActions
          actions={artwork.actions}
          title={artwork.title}
          locale={locale}
          onTrade={(action) => onTrade(artwork.id, action)}
        />
      </div>
    </article>
  );
}
