"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { mediaDataUrl } from "@/lib/stream/content";
import { parseCap, type Draft } from "@/lib/stream/createDraft";

import { formatCount, formatEth, formatSpan } from "./format";
import { CARD, LABEL } from "./OneOfOnePanel";
import { useSaleTerms } from "./useStreamData";

/**
 * The 1/1 auction's terms on this instance, read live from the auction and
 * asset contracts: length, extension, bid step and opening bid.
 */
export function SaleTermsList({ editions }: { readonly editions: boolean }) {
  const locale = useBrowserLocale();
  const terms = useSaleTerms();
  if (!terms.data) {
    return <p className="tw-m-0 tw-text-sm tw-text-iron-500">{t(locale, "streamSepolia.loading")}</p>;
  }
  const { duration, extensionWindow, bidStep, openingBid } = terms.data;
  const rows: [string, string][] = [
    [t(locale, "streamSepolia.terms.kind"), t(locale, "streamSepolia.terms.english")],
    [t(locale, "streamSepolia.terms.length"), formatSpan(duration, locale)],
    [t(locale, "streamSepolia.terms.opening"), `${formatEth(openingBid, locale)} ETH`],
    [
      t(locale, "streamSepolia.terms.step"),
      t(locale, "streamSepolia.terms.stepValue", { percent: formatCount(Math.round(bidStep * 1000) / 10, locale) }),
    ],
    [
      t(locale, "streamSepolia.terms.extension"),
      t(locale, "streamSepolia.terms.extensionValue", { window: formatSpan(extensionWindow, locale) }),
    ],
  ];
  if (editions) rows.push([t(locale, "streamSepolia.terms.editions"), t(locale, "streamSepolia.terms.editionsValue")]);
  return (
    <dl className="tw-m-0 tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-x-4 tw-gap-y-2 tw-text-sm">
      {rows.map(([term, value]) => (
        <div key={term} className="tw-contents">
          <dt className="tw-text-iron-500">{term}</dt>
          <dd className="tw-m-0 tw-text-iron-100">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A live preview of the work being made, with where and how it will be sold. */
export function WorkPreview({
  draft,
  product,
  artistFallback,
}: {
  readonly draft: Draft;
  /** "6529 Stream" or the artist's own contract name. */
  readonly product: string;
  readonly artistFallback: string;
}) {
  const locale = useBrowserLocale();
  const image = draft.media ? mediaDataUrl(draft.media.bytes, draft.media.mimeType) : null;
  const title = draft.title.trim() || t(locale, "streamSepolia.preview.untitled");
  const artist = draft.artistName.trim() || artistFallback;
  const cap = parseCap(draft.cap);
  let editionsLine: string | null = null;
  if (draft.editions) {
    editionsLine =
      cap !== null && cap > 0
        ? t(locale, "streamSepolia.preview.editionsCap", { cap: formatCount(cap, locale) })
        : t(locale, "streamSepolia.preview.editionsOpen");
  }
  return (
    <aside className={`${CARD} tw-flex tw-flex-col tw-gap-4`} aria-label={t(locale, "streamSepolia.preview.label")}>
      <div className="tw-flex tw-aspect-square tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-950">
        {image ? (
          // The picked file, before it is stored; next/image cannot optimise a data URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={title} className="tw-h-full tw-w-full tw-object-contain" />
        ) : (
          <span className="tw-px-6 tw-text-center tw-text-sm tw-text-iron-600">{t(locale, "streamSepolia.preview.noArt")}</span>
        )}
      </div>
      <div>
        <p className={LABEL}>{product}</p>
        <p className="tw-m-0 tw-mt-1 tw-truncate tw-text-xl tw-font-semibold tw-text-iron-50">{title}</p>
        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.preview.by", { artist })}</p>
        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-300">
          {t(locale, "streamSepolia.preview.oneOfOne")}
          {editionsLine ? ` · ${editionsLine}` : null}
        </p>
      </div>
      <div className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-4">
        <p className={`${LABEL} tw-mb-2`}>{t(locale, "streamSepolia.terms.title")}</p>
        <SaleTermsList editions={draft.editions} />
      </div>
    </aside>
  );
}
