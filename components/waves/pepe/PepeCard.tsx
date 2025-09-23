import { memo, useEffect, useState } from "react";

import ChatItemHrefButtons from "../ChatItemHrefButtons";

export type PepeKind = "asset" | "collection" | "artist" | "set";

type Market = {
  readonly bestAskSats?: number;
  readonly lastSaleSats?: number;
  readonly bestAskXcp?: number;
  readonly lastSaleXcp?: number;
  readonly approxEthPerBtc?: number;
  readonly approxEthPerXcp?: number;
  readonly updatedISO?: string;
};

type PepeAssetPreview = {
  readonly kind: "asset";
  readonly href: string;
  readonly slug: string;
  readonly asset?: string;
  readonly name?: string;
  readonly collection?: string;
  readonly artist?: string;
  readonly series?: number | null;
  readonly card?: number | null;
  readonly supply?: number | null;
  readonly holders?: number | null;
  readonly image?: string | null;
  readonly links?: {
    readonly horizon?: string;
    readonly xchain?: string;
    readonly wiki?: string;
  } | null;
  readonly market?: Market | null;
};

type PepeCollectionPreview = {
  readonly kind: "collection";
  readonly href: string;
  readonly slug: string;
  readonly name?: string;
  readonly image?: string | null;
  readonly stats?: {
    readonly items?: number | null;
    readonly floorSats?: number | null;
  } | null;
};

type PepeArtistPreview = {
  readonly kind: "artist";
  readonly href: string;
  readonly slug: string;
  readonly name?: string;
  readonly image?: string | null;
  readonly stats?: {
    readonly uniqueCards?: number | null;
    readonly collections?: string[] | null;
  } | null;
};

type PepeSetPreview = {
  readonly kind: "set";
  readonly href: string;
  readonly slug: string;
  readonly name?: string;
  readonly image?: string | null;
  readonly stats?: {
    readonly items?: number | null;
    readonly fullSetFloorSats?: number | null;
    readonly lastSaleValuationSats?: number | null;
  } | null;
  readonly links?: {
    readonly wiki?: string;
  } | null;
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

const Stat = ({ label, value }: { label: string; value?: string | null }) =>
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
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0">
        <div className="tw-flex tw-gap-3 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3">
          <div className="tw-aspect-square tw-w-16 tw-rounded-md tw-bg-iron-800 tw-animate-pulse" />
          <div className="tw-flex-1 tw-space-y-2">
            <div className="tw-h-4 tw-w-2/3 tw-rounded tw-bg-iron-800 tw-animate-pulse" />
            <div className="tw-h-3 tw-w-1/3 tw-rounded tw-bg-iron-800 tw-animate-pulse" />
            <div className="tw-h-3 tw-w-1/2 tw-rounded tw-bg-iron-800 tw-animate-pulse" />
          </div>
        </div>
      </div>
      <ChatItemHrefButtons href={href} />
    </div>
  );
}

function renderFallback(href: string) {
  return (
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="tw-flex tw-h-full tw-w-full tw-flex-col tw-justify-center tw-gap-y-1 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 tw-text-left tw-no-underline tw-transition-colors tw-duration-200 hover:tw-border-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
          aria-label="Open pepe.wtf"
        >
          <span className="tw-text-sm tw-font-medium tw-text-iron-100">Open on pepe.wtf</span>
          <span className="tw-text-xs tw-text-iron-400">{href}</span>
        </a>
      </div>
      <ChatItemHrefButtons href={href} />
    </div>
  );
}

function renderImage(image: string | null | undefined, alt: string) {
  if (!image) {
    return <div className="tw-aspect-square tw-w-16 tw-rounded-md tw-bg-iron-800" />;
  }

  return (
    <img
      src={image}
      alt={alt}
      className="tw-aspect-square tw-w-16 tw-rounded-md tw-object-cover"
      loading="lazy"
    />
  );
}

function renderCollection(preview: PepeCollectionPreview) {
  const title = preview.name ?? preview.slug;

  return (
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0">
        <div className="tw-flex tw-gap-3 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3">
          {renderImage(preview.image, title)}
          <div className="tw-min-w-0 tw-flex-1">
            <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
              <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100 tw-truncate">{title}</p>
              <span className="tw-inline-flex tw-items-center tw-rounded tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-iron-200">
                Collection
              </span>
            </div>
            <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1">
              <Stat label="Items" value={formatters.int(preview.stats?.items ?? null)} />
              <Stat label="Floor" value={formatters.sats(preview.stats?.floorSats ?? null)} />
            </div>
            <div className="tw-mt-2">
              <a
                className="tw-text-xs tw-text-primary-300 hover:tw-underline"
                href={preview.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                Browse on pepe.wtf
              </a>
            </div>
          </div>
        </div>
      </div>
      <ChatItemHrefButtons href={preview.href} />
    </div>
  );
}

function renderArtist(preview: PepeArtistPreview) {
  const title = preview.name ?? preview.slug;
  const collections = preview.stats?.collections?.slice(0, 3)?.join(" · ");

  return (
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0">
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
                rel="noopener noreferrer nofollow"
              >
                Browse artist on pepe.wtf
              </a>
            </div>
          </div>
        </div>
      </div>
      <ChatItemHrefButtons href={preview.href} />
    </div>
  );
}

function renderSet(preview: PepeSetPreview) {
  const title = preview.name ?? preview.slug;

  return (
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0">
        <div className="tw-flex tw-gap-3 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3">
          {renderImage(preview.image, title)}
          <div className="tw-min-w-0 tw-flex-1">
            <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
              <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100 tw-truncate">{title}</p>
              <span className="tw-inline-flex tw-items-center tw-rounded tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-iron-200">
                Set
              </span>
            </div>
            <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1">
              <Stat label="Items" value={formatters.int(preview.stats?.items ?? null)} />
              <Stat label="Full set floor" value={formatters.sats(preview.stats?.fullSetFloorSats ?? null)} />
            </div>
            <div className="tw-mt-2 tw-flex tw-gap-3 tw-flex-wrap">
              <a
                className="tw-text-xs tw-text-primary-300 hover:tw-underline"
                href={preview.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                Open set on pepe.wtf
              </a>
              {preview.links?.wiki ? (
                <a
                  className="tw-text-xs tw-text-primary-300 hover:tw-underline"
                  href={preview.links.wiki}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  Lore
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <ChatItemHrefButtons href={preview.href} />
    </div>
  );
}

function renderAsset(preview: PepeAssetPreview, originalHref: string) {
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

  const bestAskPrimary =
    (preview.market?.bestAskSats && formatters.sats(preview.market.bestAskSats)) ||
    (preview.market?.bestAskXcp && formatters.xcp(preview.market.bestAskXcp)) ||
    null;
  const bestAskEth =
    (preview.market?.bestAskSats &&
      formatters.ethFromSats(preview.market.bestAskSats, preview.market.approxEthPerBtc)) ||
    (preview.market?.bestAskXcp &&
      formatters.ethFromXcp(preview.market.bestAskXcp, preview.market.approxEthPerXcp)) ||
    null;

  const lastSalePrimary =
    (preview.market?.lastSaleSats && formatters.sats(preview.market.lastSaleSats)) ||
    (preview.market?.lastSaleXcp && formatters.xcp(preview.market.lastSaleXcp)) ||
    null;
  const lastSaleEth =
    (preview.market?.lastSaleSats &&
      formatters.ethFromSats(preview.market.lastSaleSats, preview.market.approxEthPerBtc)) ||
    (preview.market?.lastSaleXcp &&
      formatters.ethFromXcp(preview.market.lastSaleXcp, preview.market.approxEthPerXcp)) ||
    null;

  return (
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0">
        <div className="tw-flex tw-gap-3 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3">
          {renderImage(preview.image, name)}
          <div className="tw-min-w-0 tw-flex-1">
            <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
              <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100 tw-truncate">{name}</p>
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="tw-inline-flex tw-items-center tw-rounded tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-iron-200"
                >
                  {chip}
                </span>
              ))}
            </div>
            <p className="tw-mt-0.5 tw-mb-0 tw-text-xs tw-text-iron-300 tw-truncate">
              {[preview.artist, seriesCard].filter(Boolean).join(" · ")}
            </p>
            <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1">
              <Stat label="Supply" value={formatters.int(preview.supply ?? null)} />
              <Stat label="Holders" value={formatters.int(preview.holders ?? null)} />
              <Stat label="List" value={[bestAskPrimary, bestAskEth].filter(Boolean).join(" ")} />
              <Stat label="Last sale" value={[lastSalePrimary, lastSaleEth].filter(Boolean).join(" ")} />
            </div>
            <div className="tw-mt-2 tw-flex tw-gap-3 tw-flex-wrap">
              <a
                className="tw-text-xs tw-text-primary-300 hover:tw-underline"
                href={preview.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                Open on pepe.wtf
              </a>
              {preview.links?.horizon ? (
                <a
                  className="tw-text-xs tw-text-primary-300 hover:tw-underline"
                  href={preview.links.horizon}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  View on Horizon
                </a>
              ) : null}
              {preview.links?.xchain ? (
                <a
                  className="tw-text-xs tw-text-primary-300 hover:tw-underline"
                  href={preview.links.xchain}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  View on XChain
                </a>
              ) : null}
              {preview.links?.wiki ? (
                <a
                  className="tw-text-xs tw-text-primary-300 hover:tw-underline"
                  href={preview.links.wiki}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  Lore
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <ChatItemHrefButtons href={originalHref} />
    </div>
  );
}

const PepeCard = memo(function PepeCard({ kind, slug, href }: PepeCardProps) {
  const [preview, setPreview] = useState<PepePreview | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setPreview(null);
    setHasError(false);

    fetch(`/api/pepe/resolve?kind=${encodeURIComponent(kind)}&slug=${encodeURIComponent(slug)}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data: PepePreview) => setPreview(data))
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name === "AbortError") {
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
    return renderAsset(preview, href);
  }

  if (preview.kind === "artist") {
    return renderArtist(preview);
  }

  if (preview.kind === "set") {
    return renderSet(preview);
  }

  return renderCollection(preview);
});

export default PepeCard;
