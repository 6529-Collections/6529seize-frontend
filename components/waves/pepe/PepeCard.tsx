import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import Image from "next/image";
import { memo, useEffect, useState } from "react";

import LinkHandlerFrame from "../LinkHandlerFrame";

export type PepeKind = "asset" | "collection" | "artist" | "set";

type Market = {
  readonly bestAskSats?: number | undefined;
  readonly lastSaleSats?: number | undefined;
  readonly bestAskXcp?: number | undefined;
  readonly lastSaleXcp?: number | undefined;
  readonly approxEthPerBtc?: number | undefined;
  readonly approxEthPerXcp?: number | undefined;
  readonly updatedISO?: string | undefined;
};

type PepeAssetPreview = {
  readonly kind: "asset";
  readonly href: string;
  readonly slug: string;
  readonly asset?: string | undefined;
  readonly name?: string | undefined;
  readonly collection?: string | undefined;
  readonly artist?: string | undefined;
  readonly series?: number | null | undefined;
  readonly card?: number | null | undefined;
  readonly supply?: number | null | undefined;
  readonly holders?: number | null | undefined;
  readonly image?: string | null | undefined;
  readonly links?: {
    readonly horizon?: string | undefined;
    readonly xchain?: string | undefined;
    readonly wiki?: string | undefined;
  } | null | undefined;
  readonly market?: Market | null | undefined;
};

type PepeCollectionPreview = {
  readonly kind: "collection";
  readonly href: string;
  readonly slug: string;
  readonly name?: string | undefined;
  readonly image?: string | null | undefined;
  readonly stats?: {
    readonly items?: number | null | undefined;
    readonly floorSats?: number | null | undefined;
  } | null | undefined;
};

type PepeArtistPreview = {
  readonly kind: "artist";
  readonly href: string;
  readonly slug: string;
  readonly name?: string | undefined;
  readonly image?: string | null | undefined;
  readonly stats?: {
    readonly uniqueCards?: number | null | undefined;
    readonly collections?: string[] | null | undefined;
  } | null | undefined;
};

type PepeSetPreview = {
  readonly kind: "set";
  readonly href: string;
  readonly slug: string;
  readonly name?: string | undefined;
  readonly image?: string | null | undefined;
  readonly stats?: {
    readonly items?: number | null | undefined;
    readonly fullSetFloorSats?: number | null | undefined;
    readonly lastSaleValuationSats?: number | null | undefined;
  } | null | undefined;
  readonly links?: {
    readonly wiki?: string | undefined;
  } | null | undefined;
};

type PepePreview =
  | PepeAssetPreview
  | PepeCollectionPreview
  | PepeArtistPreview
  | PepeSetPreview;

type PepeCardProps = {
  readonly kind: PepeKind;
  readonly slug: string;
  readonly href: string;
};

const Stat = ({ label, value }: { label: string; value?: string | null | undefined }) =>
  value ? (
    <div className="tw-flex tw-items-baseline tw-gap-1 tw-text-xs tw-text-iron-300">
      <span className="tw-text-iron-400">{label}</span>
      <span className="tw-font-medium tw-text-iron-100">{value}</span>
    </div>
  ) : null;

const formatters = {
  int: (value?: number | null) =>
    typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : null,
  sats: (value?: number | null) =>
    typeof value === "number" ? `${Math.round(value).toLocaleString()} sats` : null,
  xcp: (value?: number | null) =>
    typeof value === "number" ? `${value.toFixed(4)} XCP` : null,
  ethFromSats: (value?: number | null, rate?: number | null) =>
    typeof value === "number" && typeof rate === "number" && rate > 0
      ? `≈ ${(value / 1e8 * rate).toFixed(4)} ETH`
      : null,
  ethFromXcp: (value?: number | null, rate?: number | null) =>
    typeof value === "number" && typeof rate === "number" && rate > 0
      ? `≈ ${(value * rate).toFixed(4)} ETH`
      : null,
};

function renderLoadingState(href: string) {
  return (
    <LinkHandlerFrame href={href}>
      <div className="tw-flex tw-gap-3 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3">
        <div className="tw-aspect-square tw-w-16 tw-rounded-md tw-bg-iron-800 tw-animate-pulse" />
        <div className="tw-flex-1 tw-space-y-2">
          <div className="tw-h-4 tw-w-2/3 tw-rounded tw-bg-iron-800 tw-animate-pulse" />
          <div className="tw-h-3 tw-w-1/3 tw-rounded tw-bg-iron-800 tw-animate-pulse" />
          <div className="tw-h-3 tw-w-1/2 tw-rounded tw-bg-iron-800 tw-animate-pulse" />
        </div>
      </div>
    </LinkHandlerFrame>
  );
}

function renderFallback(href: string) {
  return (
    <LinkHandlerFrame href={href}>
      <a
        href={href}
        target="_blank"
        rel="nofollow noopener noreferrer"
        className="tw-flex tw-h-full tw-w-full tw-flex-col tw-justify-center tw-gap-y-1 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 tw-text-left tw-no-underline tw-transition-colors tw-duration-200 hover:tw-border-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        aria-label="Open pepe.wtf"
      >
        <span className="tw-text-sm tw-font-medium tw-text-iron-100">Open on pepe.wtf</span>
        <span className="tw-text-xs tw-text-iron-400">{href}</span>
      </a>
    </LinkHandlerFrame>
  );
}

function renderImage(image: string | null | undefined, alt: string) {
  if (!image) {
    return <div className="tw-aspect-square tw-w-16 tw-rounded-md tw-bg-iron-800" />;
  }

  return (
    <Image
      unoptimized
      width={64}
      height={64}
      src={image}
      alt={alt}
      className="tw-aspect-square tw-w-16 tw-rounded-md tw-object-cover"
      loading="lazy"
    />
  );
}

function renderCollection(
  preview: PepeCollectionPreview,
  showMarketPrices: boolean
) {
  const title = preview.name ?? preview.slug;

  return (
    <LinkHandlerFrame href={preview.href}>
      <div className="tw-flex tw-gap-3 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3">
        {renderImage(preview.image, title)}
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <p className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
              {title}
            </p>
            <span className="tw-inline-flex tw-items-center tw-rounded tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-iron-200">
              Collection
            </span>
          </div>
          <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1">
            <Stat
              label="Items"
              value={formatters.int(preview.stats?.items ?? null)}
            />
            {showMarketPrices && (
              <Stat
                label="Floor"
                value={formatters.sats(preview.stats?.floorSats ?? null)}
              />
            )}
          </div>
          <div className="tw-mt-2">
            <a
              className="tw-text-xs tw-text-primary-300 hover:tw-underline"
              href={preview.href}
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              Browse on pepe.wtf
            </a>
          </div>
        </div>
      </div>
    </LinkHandlerFrame>
  );
}

function renderArtist(preview: PepeArtistPreview) {
  const title = preview.name ?? preview.slug;
  const collections = preview.stats?.collections?.slice(0, 3)?.join(" · ");

  return (
    <LinkHandlerFrame href={preview.href}>
      <div className="tw-flex tw-gap-3 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3">
        {renderImage(preview.image, title)}
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
            <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100 tw-truncate">{title}</p>
            <span className="tw-inline-flex tw-items-center tw-rounded tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-iron-200">
              Artist
            </span>
          </div>
          <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1">
            <Stat label="Unique cards" value={formatters.int(preview.stats?.uniqueCards ?? null)} />
            <Stat label="Collections" value={collections ?? null} />
          </div>
          <div className="tw-mt-2">
            <a
              className="tw-text-xs tw-text-primary-300 hover:tw-underline"
              href={preview.href}
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              Browse artist on pepe.wtf
            </a>
          </div>
        </div>
      </div>
    </LinkHandlerFrame>
  );
}

function renderSet(preview: PepeSetPreview, showMarketPrices: boolean) {
  const title = preview.name ?? preview.slug;

  return (
    <LinkHandlerFrame href={preview.href}>
      <div className="tw-flex tw-gap-3 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3">
        {renderImage(preview.image, title)}
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <p className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
              {title}
            </p>
            <span className="tw-inline-flex tw-items-center tw-rounded tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-iron-200">
              Set
            </span>
          </div>
          <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1">
            <Stat
              label="Items"
              value={formatters.int(preview.stats?.items ?? null)}
            />
            {showMarketPrices && (
              <Stat
                label="Full set floor"
                value={formatters.sats(preview.stats?.fullSetFloorSats ?? null)}
              />
            )}
          </div>
          <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-3">
            <a
              className="tw-text-xs tw-text-primary-300 hover:tw-underline"
              href={preview.href}
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              Open set on pepe.wtf
            </a>
            {preview.links?.wiki ? (
              <a
                className="tw-text-xs tw-text-primary-300 hover:tw-underline"
                href={preview.links.wiki}
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                Lore
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </LinkHandlerFrame>
  );
}

function marketAmount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value !== 0
    ? value
    : null;
}

function formatMarketValue(
  satsValue: number | null | undefined,
  xcpValue: number | null | undefined,
  market: Market | null | undefined
) {
  const sats = marketAmount(satsValue);
  const xcp = marketAmount(xcpValue);
  const primary = formatters.sats(sats) ?? formatters.xcp(xcp);
  const eth =
    formatters.ethFromSats(sats, market?.approxEthPerBtc) ??
    formatters.ethFromXcp(xcp, market?.approxEthPerXcp);
  return [primary, eth].filter(Boolean).join(" ");
}

function renderAsset(
  preview: PepeAssetPreview,
  originalHref: string,
  showMarketPrices: boolean
) {
  const name = preview.name ?? preview.asset ?? preview.slug;
  const chips = [preview.collection, preview.asset].filter(Boolean) as string[];
  const seriesCard =
    typeof preview.series === "number" || typeof preview.card === "number"
      ? [
          typeof preview.series === "number" ? `S${preview.series}` : null,
          typeof preview.card === "number" ? `C${preview.card}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  const market = preview.market;

  return (
    <LinkHandlerFrame href={originalHref}>
      <div className="tw-flex tw-gap-3 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3">
        {renderImage(preview.image, name)}
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <p className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
              {name}
            </p>
            {chips.map((chip) => (
              <span
                key={chip}
                className="tw-inline-flex tw-items-center tw-rounded tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-iron-200"
              >
                {chip}
              </span>
            ))}
          </div>
          <p className="tw-mb-0 tw-mt-0.5 tw-truncate tw-text-xs tw-text-iron-300">
            {[preview.artist, seriesCard].filter(Boolean).join(" · ")}
          </p>
          <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1">
            <Stat
              label="Supply"
              value={formatters.int(preview.supply ?? null)}
            />
            <Stat
              label="Holders"
              value={formatters.int(preview.holders ?? null)}
            />
            <Stat
              label="List"
              value={
                showMarketPrices
                  ? formatMarketValue(
                      market?.bestAskSats,
                      market?.bestAskXcp,
                      market
                    )
                  : undefined
              }
            />
            <Stat
              label="Last sale"
              value={formatMarketValue(
                market?.lastSaleSats,
                market?.lastSaleXcp,
                market
              )}
            />
          </div>
          <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-3">
            <a
              className="tw-text-xs tw-text-primary-300 hover:tw-underline"
              href={preview.href}
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              Open on pepe.wtf
            </a>
            {preview.links?.horizon ? (
              <a
                className="tw-text-xs tw-text-primary-300 hover:tw-underline"
                href={preview.links.horizon}
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                View on Horizon
              </a>
            ) : null}
            {preview.links?.xchain ? (
              <a
                className="tw-text-xs tw-text-primary-300 hover:tw-underline"
                href={preview.links.xchain}
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                View on XChain
              </a>
            ) : null}
            {preview.links?.wiki ? (
              <a
                className="tw-text-xs tw-text-primary-300 hover:tw-underline"
                href={preview.links.wiki}
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                Lore
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </LinkHandlerFrame>
  );
}

const PepeCard = memo(function PepeCard({ kind, slug, href }: PepeCardProps) {
  const { hideNftPurchasing } = useNftPurchasingVisibility();
  const [preview, setPreview] = useState<PepePreview | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setPreview(null);
    setHasError(false);

    fetch(
      `/api/pepe/resolve?kind=${encodeURIComponent(kind)}&slug=${encodeURIComponent(slug)}`,
      {
        signal: controller.signal,
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data: PepePreview) => setPreview(data))
      .catch((error: unknown) => {
        if ((error as { name?: string | undefined })?.name === "AbortError") {
          return;
        }
        setHasError(true);
      });

    return () => controller.abort();
  }, [kind, slug]);

  if (hasError) {
    return renderFallback(href);
  }

  if (!preview) {
    return renderLoadingState(href);
  }

  if (preview.kind === "asset") {
    return renderAsset(preview, href, !hideNftPurchasing);
  }

  if (preview.kind === "artist") {
    return renderArtist(preview);
  }

  if (preview.kind === "set") {
    return renderSet(preview, !hideNftPurchasing);
  }

  return renderCollection(preview, !hideNftPurchasing);
});

export default PepeCard;
