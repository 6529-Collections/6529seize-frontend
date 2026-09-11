"use client";

import Button from "@/components/utils/button/Button";
import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CollectArtworkView, CollectTradeAction } from "./collect.types";

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
    <article className="tw-flex tw-min-w-0 tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950">
      <Link
        href={artwork.href}
        aria-label={t(locale, "collect.artworkLink", { title: artwork.title })}
        className="tw-group tw-block tw-text-iron-100 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <div className="tw-relative tw-flex tw-aspect-square tw-items-center tw-justify-center tw-overflow-hidden tw-bg-iron-900 [&_img]:tw-max-h-full [&_img]:tw-object-contain">
          {artwork.media}
        </div>
        <div className="tw-space-y-1 tw-px-3 tw-pb-3 tw-pt-4 sm:tw-px-4">
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {artwork.tokenLabel}
          </p>
          <h2 className="tw-m-0 tw-break-words tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100 group-hover:tw-text-white">
            {artwork.title}
          </h2>
          <p className="tw-m-0 tw-break-words tw-text-xs tw-leading-5 tw-text-iron-400">
            {artwork.artist}
          </p>
        </div>
      </Link>
      <div className="tw-mt-auto tw-space-y-3 tw-px-3 tw-pb-4 sm:tw-px-4">
        {artwork.ownedLabel !== null && (
          <p className="tw-m-0 tw-text-xs tw-text-iron-300">
            {artwork.ownedLabel}
          </p>
        )}
        <div className="tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-3">
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-tabular-nums tw-text-iron-100">
            {artwork.priceLabel ?? t(locale, "collect.noPrice")}
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
        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
          {artwork.actions.map(({ action, disabledReason }) => (
            <div key={action} className="tw-min-w-0">
              <Button
                variant={action === "buy" ? "action" : "secondary"}
                size="sm"
                fullWidth
                disabled={Boolean(disabledReason)}
                aria-label={t(locale, "collect.actionFor", {
                  action: t(locale, `collect.action.${action}`),
                  title: artwork.title,
                })}
                onClick={() => onTrade(artwork.id, action)}
                className="tw-min-h-11 !tw-whitespace-normal"
              >
                {t(locale, `collect.action.${action}`)}
              </Button>
              {disabledReason && (
                <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-leading-4 tw-text-iron-400">
                  {disabledReason}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
