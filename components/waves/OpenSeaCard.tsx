"use client";

import Image from "next/image";
import Link from "next/link";

import type { LinkPreviewMedia, LinkPreviewResponse } from "@/services/api/link-preview-api";

import { LinkPreviewCardLayout } from "./OpenGraphPreview";

type OpenSeaItemSupply = {
  readonly total: string | null;
  readonly standard: string;
};

type OpenSeaRoyaltyInfo = {
  readonly receiver: string | null;
  readonly bps: number | null;
  readonly supports2981: boolean;
};

type OpenSeaLinks = {
  readonly opensea?: string | null;
  readonly etherscan?: string | null;
  readonly metadata?: string | null;
};

type OpenSeaItemResponse = LinkPreviewResponse & {
  readonly type: "opensea.item";
  readonly contract?: string;
  readonly tokenId?: string;
  readonly standard?: string;
  readonly name?: string | null;
  readonly attributes?: ReadonlyArray<{ trait_type?: string; value: unknown }>;
  readonly owner?: string | null;
  readonly supply?: OpenSeaItemSupply | null;
  readonly royalties?: OpenSeaRoyaltyInfo | null;
  readonly links?: OpenSeaLinks | null;
};

type OpenSeaCollectionResponse = LinkPreviewResponse & {
  readonly type: "opensea.collection" | "opensea.collection.slug";
  readonly name?: string | null;
  readonly symbol?: string | null;
  readonly standard?: string | null;
  readonly supply?: string | null;
  readonly sampleImage?: string | null;
  readonly links?: OpenSeaLinks | null;
};

type OpenSeaTxSummary = {
  readonly item?: {
    readonly contract: string;
    readonly tokenId: string;
    readonly standard: string;
  } | null;
  readonly price?: {
    readonly amount: string;
    readonly asset: string;
  } | null;
  readonly buyer?: string;
  readonly seller?: string;
};

type OpenSeaTransactionResponse = LinkPreviewResponse & {
  readonly type: "opensea.tx";
  readonly hash: string;
  readonly status?: string | null;
  readonly market?: string | null;
  readonly summary?: OpenSeaTxSummary | null;
  readonly links?: OpenSeaLinks | null;
};

export type OpenSeaResponse =
  | OpenSeaItemResponse
  | OpenSeaCollectionResponse
  | OpenSeaTransactionResponse;

const imageFromMedia = (media?: LinkPreviewMedia | null, fallbacks?: readonly LinkPreviewMedia[] | null) => {
  if (media?.url) {
    return media.url;
  }
  if (fallbacks) {
    for (const entry of fallbacks) {
      if (entry?.url) {
        return entry.url;
      }
    }
  }
  return undefined;
};

const formatSupply = (supply?: OpenSeaItemSupply | null) => {
  if (!supply) {
    return undefined;
  }
  if (supply.total) {
    if (supply.standard) {
      return `${supply.total} (${supply.standard})`;
    }
    return supply.total;
  }
  return supply.standard;
};

const formatAttributeValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => formatAttributeValue(entry))
      .filter((entry) => entry.length > 0)
      .join(", ");
  }
  if (value instanceof Date) {
    return value.toISOString();
  }

  switch (typeof value) {
    case "string":
      return value;
    case "number":
    case "boolean":
    case "bigint":
      return String(value);
    case "symbol":
      return value.toString();
    case "function":
      return value.name ? `[function ${value.name}]` : "function";
    case "object":
      try {
        return JSON.stringify(value);
      } catch {
        const fallback = (value as { toString?: () => string }).toString?.();
        if (typeof fallback === "string" && fallback !== "[object Object]") {
          return fallback;
        }
        return "[unserializable object]";
      }
    default:
      return "";
  }
};

const formatRoyalties = (royalties?: OpenSeaRoyaltyInfo | null) => {
  if (!royalties) {
    return undefined;
  }
  if (typeof royalties.bps === "number" && royalties.receiver) {
    const percent = (royalties.bps / 100).toFixed(2).replace(/\.00$/, "");
    return `${percent}% to ${shorten(royalties.receiver)}`;
  }
  if (royalties.receiver) {
    return shorten(royalties.receiver);
  }
  if (typeof royalties.bps === "number") {
    const percent = (royalties.bps / 100).toFixed(2).replace(/\.00$/, "");
    return `${percent}%`;
  }
  if (royalties.supports2981) {
    return "ERC2981";
  }
  return undefined;
};

const shorten = (value?: string | null, tail = 4) => {
  if (!value) {
    return undefined;
  }
  if (value.length <= tail * 2 + 3) {
    return value;
  }
  return `${value.slice(0, tail + 2)}…${value.slice(-tail)}`;
};

const linkList = (links?: OpenSeaLinks | null) => {
  if (!links) {
    return null;
  }

  const entries: Array<[string, string]> = [];

  if (links.opensea) {
    entries.push(["OpenSea", links.opensea]);
  }
  if (links.metadata) {
    entries.push(["Metadata", links.metadata]);
  }
  if (links.etherscan) {
    entries.push(["Etherscan", links.etherscan]);
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-wrap tw-gap-3">
      {entries.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-text-xs tw-font-semibold tw-text-primary-300 tw-no-underline hover:tw-text-primary-200"
        >
          {label}
        </Link>
      ))}
    </div>
  );
};

const AttributeList = ({
  attributes,
}: {
  readonly attributes: ReadonlyArray<{ trait_type?: string; value: unknown }>;
}) => {
  if (!attributes.length) {
    return null;
  }

  return (
    <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
      {attributes.slice(0, 6).map((attribute, index) => {
        const value = attribute?.value;
        if (value === null || value === undefined || value === "") {
          return null;
        }
        return (
          <div
            key={`${attribute?.trait_type ?? "attr"}-${index}`}
            className="tw-flex tw-flex-col tw-rounded-md tw-border tw-border-iron-800 tw-bg-iron-900/70 tw-px-3 tw-py-2"
          >
            {attribute?.trait_type ? (
              <span className="tw-text-[10px] tw-uppercase tw-tracking-wide tw-text-iron-400">
                {attribute.trait_type}
              </span>
            ) : null}
            <span className="tw-text-xs tw-font-semibold tw-text-iron-100 tw-break-words">
              {formatAttributeValue(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const ImagePreview = ({ src, alt }: { src?: string; alt: string }) => {
  if (!src) {
    return (
      <div className="tw-flex tw-h-24 tw-w-24 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-900/60 tw-text-xs tw-text-iron-500">
        No image
      </div>
    );
  }

  return (
    <div className="tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/60">
      <Image
        src={src}
        alt={alt}
        width={256}
        height={256}
        className="tw-h-24 tw-w-24 tw-object-cover"
        loading="lazy"
        unoptimized
      />
    </div>
  );
};

const renderItemCard = (href: string, data: OpenSeaItemResponse) => {
  const imageUrl = imageFromMedia(data.image, data.images as ReadonlyArray<LinkPreviewMedia> | undefined);
  const supply = formatSupply(data.supply);
  const royalty = formatRoyalties(data.royalties);

  const metadataRows: Array<{ label: string; value?: string }> = [
    { label: "Contract", value: shorten(data.contract) },
    { label: "Token ID", value: data.tokenId },
    { label: "Standard", value: data.standard },
    { label: "Owned by", value: shorten(data.owner) },
    { label: "Supply", value: supply },
    { label: "Royalties", value: royalty },
  ];

  return (
    <LinkPreviewCardLayout href={href}>
      <div className="tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
        <div className="tw-flex tw-gap-3">
          <ImagePreview src={imageUrl} alt={data.title ?? data.name ?? "OpenSea Item"} />
          <div className="tw-min-w-0 tw-flex-1">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
              OpenSea Item
            </span>
            <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100 tw-truncate">
              {data.name ?? data.title ?? data.url ?? "Item"}
            </h3>
            {data.description ? (
              <p className="tw-mt-1 tw-text-sm tw-leading-relaxed tw-text-iron-200 tw-line-clamp-3">
                {data.description}
              </p>
            ) : null}
            <div className="tw-mt-2 tw-grid tw-gap-2 md:tw-grid-cols-2">
              {metadataRows
                .filter((row) => row.value)
                .map((row) => (
                  <div key={row.label} className="tw-flex tw-flex-col">
                    <span className="tw-text-[10px] tw-uppercase tw-tracking-wide tw-text-iron-400">
                      {row.label}
                    </span>
                    <span className="tw-text-sm tw-font-medium tw-text-iron-100 tw-break-words">
                      {row.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
        {Array.isArray(data.attributes) && data.attributes.length > 0 ? (
          <AttributeList attributes={data.attributes} />
        ) : null}
        {linkList(data.links)}
      </div>
    </LinkPreviewCardLayout>
  );
};

const renderCollectionCard = (href: string, data: OpenSeaCollectionResponse) => {
  const imageUrl = imageFromMedia(data.image, data.images as ReadonlyArray<LinkPreviewMedia> | undefined) ?? data.sampleImage ?? undefined;

  const metadataRows: Array<{ label: string; value?: string }> = [
    { label: "Symbol", value: data.symbol ?? undefined },
    { label: "Standard", value: data.standard ?? undefined },
    { label: "Supply", value: data.supply ?? undefined },
  ];

  return (
    <LinkPreviewCardLayout href={href}>
      <div className="tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
        <div className="tw-flex tw-gap-3">
          <ImagePreview src={imageUrl ?? undefined} alt={data.title ?? data.name ?? "OpenSea Collection"} />
          <div className="tw-min-w-0 tw-flex-1">
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
              OpenSea Collection
            </span>
            <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100 tw-truncate">
              {data.name ?? data.title ?? data.url ?? "Collection"}
            </h3>
            {data.description ? (
              <p className="tw-mt-1 tw-text-sm tw-leading-relaxed tw-text-iron-200 tw-line-clamp-3">
                {data.description}
              </p>
            ) : null}
            <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-4">
              {metadataRows
                .filter((row) => row.value)
                .map((row) => (
                  <div key={row.label} className="tw-flex tw-flex-col">
                    <span className="tw-text-[10px] tw-uppercase tw-tracking-wide tw-text-iron-400">
                      {row.label}
                    </span>
                    <span className="tw-text-sm tw-font-medium tw-text-iron-100 tw-break-words">
                      {row.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
        {linkList(data.links)}
      </div>
    </LinkPreviewCardLayout>
  );
};

const renderTransactionCard = (href: string, data: OpenSeaTransactionResponse) => {
  const statusLabel = data.status ? data.status.toUpperCase() : undefined;
  const summary = data.summary;

  const summaryRows: Array<{ label: string; value?: string }> = [];
  if (summary?.item) {
    summaryRows.push(
      { label: "Token", value: `${shorten(summary.item.contract)} #${summary.item.tokenId}` },
      { label: "Standard", value: summary.item.standard }
    );
  }
  if (summary?.price) {
    summaryRows.push({ label: "Price", value: `${summary.price.amount} ${summary.price.asset}` });
  }
  if (summary?.buyer) {
    summaryRows.push({ label: "Buyer", value: shorten(summary.buyer) });
  }
  if (summary?.seller) {
    summaryRows.push({ label: "Seller", value: shorten(summary.seller) });
  }

  return (
    <LinkPreviewCardLayout href={href}>
      <div className="tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
        <div className="tw-flex tw-items-start tw-justify-between">
          <div>
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
              OpenSea Transaction
            </span>
            <h3 className="tw-mt-1 tw-text-lg tw-font-semibold tw-text-iron-100">{shorten(data.hash, 6)}</h3>
            {data.market ? (
              <p className="tw-m-0 tw-text-xs tw-text-iron-300">Market: {data.market}</p>
            ) : null}
          </div>
          {statusLabel ? (
            <span className="tw-rounded-full tw-bg-iron-800/70 tw-px-3 tw-py-1 tw-text-[10px] tw-font-semibold tw-text-iron-200">
              {statusLabel}
            </span>
          ) : null}
        </div>
        {summaryRows.length ? (
          <div className="tw-grid tw-gap-2 md:tw-grid-cols-2">
            {summaryRows.map((row) => (
              <div key={row.label} className="tw-flex tw-flex-col">
                <span className="tw-text-[10px] tw-uppercase tw-tracking-wide tw-text-iron-400">
                  {row.label}
                </span>
                <span className="tw-text-sm tw-font-medium tw-text-iron-100 tw-break-words">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        {linkList(data.links)}
      </div>
    </LinkPreviewCardLayout>
  );
};

function isOpenSeaResponse(response: unknown): response is OpenSeaResponse {
  if (!response || typeof response !== "object") {
    return false;
  }
  const type = (response as { type?: unknown }).type;
  if (typeof type !== "string") {
    return false;
  }
  return type.startsWith("opensea.");
}

export function toOpenSeaResponse(response: unknown): OpenSeaResponse | undefined {
  if (isOpenSeaResponse(response)) {
    return response;
  }
  return undefined;
}

export default function OpenSeaCard({ href, data }: { readonly href: string; readonly data: OpenSeaResponse }) {
  if (data.type === "opensea.item") {
    return renderItemCard(href, data);
  }

  if (data.type === "opensea.collection" || data.type === "opensea.collection.slug") {
    return renderCollectionCard(href, data);
  }

  if (data.type === "opensea.tx") {
    return renderTransactionCard(href, data);
  }

  return null;
}
