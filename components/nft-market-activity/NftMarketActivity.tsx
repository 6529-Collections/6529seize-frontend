"use client";

import Address from "@/components/address/Address";
import {
  getNextGenIconUrl,
  getNextGenImageUrl,
} from "@/components/nextGen/collections/nextgenToken/NextGenTokenImage";
import {
  formatNameForUrl,
  normalizeNextgenTokenID,
} from "@/components/nextGen/nextgen_helpers";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { NFT } from "@/entities/INFT";
import type { NextGenCollection } from "@/entities/INextgen";
import type { ApiNftActivityEvent } from "@/generated/models/ApiNftActivityEvent";
import { ApiNftActivityEventKindEnum } from "@/generated/models/ApiNftActivityEvent";
import type { ApiNftActivityPage } from "@/generated/models/ApiNftActivityPage";
import {
  areEqualAddresses,
  isGradientsContract,
  isMemeLabContract,
  isMemesContract,
  isNextgenContract,
} from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useNFTCollections } from "@/hooks/useNFTCollections";
import { formatDate, formatDecimalString } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useInfiniteQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useMemo, type SyntheticEvent } from "react";

export type NftActivityFilter =
  | "all"
  | "sales"
  | "purchases"
  | "mints"
  | "airdrops"
  | "transfers"
  | "burns"
  | "listings"
  | "offers"
  | "cancellations"
  | "expirations"
  | "invalidations"
  | "revalidations";

interface Props {
  readonly contract?: string | undefined;
  readonly tokenId?: string | undefined;
  readonly wallet?: string | undefined;
  readonly filter?: NftActivityFilter | undefined;
  readonly pageSize?: number | undefined;
  readonly compact?: boolean | undefined;
  readonly locale?: SupportedLocale | undefined;
}

const ACTION_KEYS: Partial<Record<string, MessageKey>> = {
  sale: "nftActivity.actions.sale",
  purchase: "nftActivity.actions.purchase",
  mint: "nftActivity.actions.mint",
  airdrop: "nftActivity.actions.airdrop",
  transfer: "nftActivity.actions.transfer",
  burn: "nftActivity.actions.burn",
  listing: "nftActivity.actions.listing",
  offer: "nftActivity.actions.offer",
  cancellation: "nftActivity.actions.cancellation",
  expiration: "nftActivity.actions.expiration",
  invalidation: "nftActivity.actions.invalidation",
  inactive: "nftActivity.actions.invalidation",
  revalidation: "nftActivity.actions.revalidation",
  fulfilled: "nftActivity.actions.fulfilled",
  order_fulfilled: "nftActivity.actions.fulfilled",
};

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

function isZeroDecimal(value: string): boolean {
  return (
    value === "0" ||
    (value.length > 2 &&
      value.startsWith("0.") &&
      value.slice(2).replaceAll("0", "") === "")
  );
}

function getAction(event: ApiNftActivityEvent): string {
  if (
    event.kind === ApiNftActivityEventKindEnum.Transaction &&
    event.action.toLowerCase() === "mint" &&
    event.price !== null &&
    isZeroDecimal(event.price)
  ) {
    return "airdrop";
  }
  return event.action.toLowerCase();
}

function getEvidenceLabel(
  evidence: string,
  locale: ReturnType<typeof useBrowserLocale>
): string | null {
  if (evidence === "provider_event") {
    return t(locale, "nftActivity.providerEvent");
  }
  if (evidence === "provider_order_status") {
    return t(locale, "nftActivity.providerStatus");
  }
  if (evidence === "elapsed_expiry") {
    return t(locale, "nftActivity.elapsedExpiry");
  }
  if (evidence === "observed_status") {
    return t(locale, "nftActivity.observedStatus");
  }
  return null;
}

function formatTotalPrice(
  event: ApiNftActivityEvent,
  locale: ReturnType<typeof useBrowserLocale>
): string | null {
  if (event.price === null) return null;
  const formattedPrice = formatDecimalString(locale, event.price);
  if (formattedPrice === "—") return null;
  const symbol = event.currency?.symbol.trim();
  return symbol ? `${formattedPrice} ${symbol}` : formattedPrice;
}

function getNextgenCollection(
  event: ApiNftActivityEvent,
  collections: readonly NextGenCollection[]
): NextGenCollection | undefined {
  if (event.token_id !== null) {
    const collectionId = normalizeNextgenTokenID(
      Number(event.token_id)
    ).collection_id;
    const byId = collections.find(
      (collection) => collection.id === collectionId
    );
    if (byId) return byId;
  }

  const slug = event.collection_slug?.toLowerCase();
  if (!slug) return undefined;
  return collections.find((collection) => {
    const rawLink: unknown = collection.opensea_link;
    if (typeof rawLink !== "string") return false;
    const link = rawLink.toLowerCase().replace(/\/$/, "");
    return link.endsWith(`/collection/${slug}`) || link.endsWith(`/${slug}`);
  });
}

function getCollectionLabel(
  event: ApiNftActivityEvent,
  collection: NextGenCollection | undefined,
  locale: ReturnType<typeof useBrowserLocale>
): string {
  if (isMemesContract(event.contract)) {
    return t(locale, "nftActivity.collections.memes");
  }
  if (isMemeLabContract(event.contract)) {
    return t(locale, "nftActivity.collections.memeLab");
  }
  if (isGradientsContract(event.contract)) {
    return t(locale, "nftActivity.collections.gradients");
  }
  if (isNextgenContract(event.contract)) {
    return collection?.name ?? t(locale, "nftActivity.collections.nextgen");
  }
  return event.collection_slug ?? event.contract;
}

function getCollectionHref(
  event: ApiNftActivityEvent,
  collection?: NextGenCollection
): string | undefined {
  if (isMemesContract(event.contract)) return "/the-memes";
  if (isMemeLabContract(event.contract)) return "/meme-lab";
  if (isGradientsContract(event.contract)) return "/6529-gradient";
  if (isNextgenContract(event.contract)) {
    return collection
      ? `/nextgen/collection/${formatNameForUrl(collection.name)}`
      : "/nextgen/collections";
  }
  return undefined;
}

function getTokenHref(event: ApiNftActivityEvent): string | undefined {
  if (event.token_id === null) return undefined;
  const encodedTokenId = encodeURIComponent(event.token_id);
  if (isMemesContract(event.contract)) return `/the-memes/${encodedTokenId}`;
  if (isMemeLabContract(event.contract)) return `/meme-lab/${encodedTokenId}`;
  if (isGradientsContract(event.contract))
    return `/6529-gradient/${encodedTokenId}`;
  if (isNextgenContract(event.contract)) {
    return `/nextgen/token/${encodedTokenId}/provenance`;
  }
  return undefined;
}

function findNft(event: ApiNftActivityEvent, nfts: readonly NFT[]) {
  if (event.token_id === null || isNextgenContract(event.contract)) {
    return undefined;
  }
  return nfts.find(
    (candidate) =>
      String(candidate.id) === event.token_id &&
      areEqualAddresses(candidate.contract, event.contract)
  );
}

function getTokenDisplayId(event: ApiNftActivityEvent): string | null {
  if (event.token_id === null) return null;
  return isNextgenContract(event.contract)
    ? String(normalizeNextgenTokenID(Number(event.token_id)).token_id)
    : event.token_id;
}

function WalletIdentity({
  wallet,
  display,
  locale,
}: {
  readonly wallet: string | null;
  readonly display?: string | null | undefined;
  readonly locale: ReturnType<typeof useBrowserLocale>;
}) {
  if (!wallet) {
    return (
      <>
        <span aria-hidden="true">—</span>
        <span className="tw-sr-only">
          {t(locale, "nftActivity.notAvailable")}
        </span>
      </>
    );
  }
  if (!ADDRESS_PATTERN.test(wallet)) return <span>{wallet}</span>;
  return (
    <Address
      wallets={[wallet as `0x${string}`]}
      display={display ?? undefined}
      hideCopy
    />
  );
}

function EventItem({
  event,
  nfts,
  nextgenCollections,
  locale,
}: {
  readonly event: ApiNftActivityEvent;
  readonly nfts: readonly NFT[];
  readonly nextgenCollections: readonly NextGenCollection[];
  readonly locale: ReturnType<typeof useBrowserLocale>;
}) {
  const nft = findNft(event, nfts);
  const isNextgen = isNextgenContract(event.contract);
  const nextgenCollection = isNextgen
    ? getNextgenCollection(event, nextgenCollections)
    : undefined;
  const collectionLabel = getCollectionLabel(event, nextgenCollection, locale);
  const itemHref =
    getTokenHref(event) ?? getCollectionHref(event, nextgenCollection);
  const tokenDisplayId = getTokenDisplayId(event);
  let itemLabel = nft?.name ?? collectionLabel;
  if (!nft && tokenDisplayId !== null) {
    itemLabel = `${collectionLabel} #${tokenDisplayId}`;
  }

  let detail = t(locale, "nftActivity.collectionWide");
  if (event.token_id !== null) {
    detail = event.quantity
      ? t(locale, "nftActivity.quantity", { quantity: event.quantity })
      : t(locale, "nftActivity.token", { tokenId: tokenDisplayId ?? "" });
  }

  let imageSrc = nft?.thumbnail ?? null;
  if (!imageSrc && event.token_id !== null && isNextgen) {
    imageSrc = getNextGenIconUrl(Number(event.token_id));
  }
  const imageFallback =
    event.token_id !== null && isNextgen
      ? getNextGenImageUrl(Number(event.token_id))
      : null;
  const imageErrorHandler = ({
    currentTarget,
  }: SyntheticEvent<HTMLImageElement>) => {
    if (imageFallback && currentTarget.src !== imageFallback) {
      currentTarget.src = imageFallback;
    } else {
      currentTarget.hidden = true;
    }
  };

  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
      {imageSrc && itemHref && (
        <Link
          href={itemHref}
          className="tw-shrink-0"
          aria-hidden="true"
          tabIndex={-1}
        >
          <Image
            src={imageSrc}
            alt=""
            width={36}
            height={36}
            className="tw-h-9 tw-w-9 tw-rounded-md tw-object-cover"
            unoptimized
            onError={imageErrorHandler}
          />
        </Link>
      )}
      <div className="tw-min-w-0">
        {itemHref ? (
          <Link
            href={itemHref}
            className="tw-font-semibold tw-text-white tw-underline tw-underline-offset-2 hover:tw-text-iron-300"
          >
            {itemLabel}
          </Link>
        ) : (
          <span className="tw-font-semibold tw-text-white">{itemLabel}</span>
        )}
        <div className="tw-mt-0.5 tw-text-xs tw-text-iron-400">{detail}</div>
      </div>
    </div>
  );
}

function EventRow({
  event,
  nfts,
  nextgenCollections,
  locale,
}: {
  readonly event: ApiNftActivityEvent;
  readonly nfts: readonly NFT[];
  readonly nextgenCollections: readonly NextGenCollection[];
  readonly locale: ReturnType<typeof useBrowserLocale>;
}) {
  const action = getAction(event);
  const actionKey = ACTION_KEYS[action];
  const actionLabel = actionKey
    ? t(locale, actionKey)
    : t(locale, "nftActivity.actions.unknown", { action });
  const evidenceLabel = getEvidenceLabel(event.evidence, locale);
  const totalPrice = formatTotalPrice(event, locale);
  const occurredAt = formatDate(locale, event.occurred_at, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const occurredAtDate = new Date(event.occurred_at);
  const occurredAtDateTime = Number.isNaN(occurredAtDate.getTime())
    ? undefined
    : occurredAtDate.toISOString();
  const fromDisplay = event.transaction_details?.from_display;
  const toDisplay = event.transaction_details?.to_display;
  return (
    <tr className="tw-border-b tw-border-solid tw-border-white/10 last:tw-border-b-0">
      <td className="tw-px-3 tw-py-3 tw-align-top">
        <span className="tw-inline-flex tw-rounded-full tw-bg-white/5 tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-100">
          {actionLabel}
        </span>
        {evidenceLabel && (
          <span className="tw-mt-1 tw-block tw-text-xs tw-text-amber-200">
            {evidenceLabel}
          </span>
        )}
      </td>
      <td className="tw-px-3 tw-py-3 tw-align-top">
        <EventItem
          event={event}
          nfts={nfts}
          nextgenCollections={nextgenCollections}
          locale={locale}
        />
      </td>
      <td className="tw-px-3 tw-py-3 tw-align-top tw-text-sm tw-text-iron-200">
        <WalletIdentity
          wallet={event.maker}
          display={fromDisplay}
          locale={locale}
        />
      </td>
      <td className="tw-px-3 tw-py-3 tw-align-top tw-text-sm tw-text-iron-200">
        <WalletIdentity
          wallet={event.taker}
          display={toDisplay}
          locale={locale}
        />
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-3 tw-align-top tw-font-medium tw-text-iron-100">
        {totalPrice ?? (
          <>
            <span aria-hidden="true">—</span>
            <span className="tw-sr-only">
              {t(locale, "nftActivity.notAvailable")}
            </span>
          </>
        )}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-3 tw-align-top tw-text-sm tw-text-iron-300">
        <div className="tw-flex tw-items-center tw-gap-2">
          {occurredAtDateTime ? (
            <time dateTime={occurredAtDateTime}>{occurredAt}</time>
          ) : (
            <span>{occurredAt}</span>
          )}
          {event.transaction_hash && (
            <Link
              href={`https://etherscan.io/tx/${encodeURIComponent(event.transaction_hash)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t(locale, "nftActivity.transactionLink")}
              className="tw-inline-flex tw-rounded-md tw-text-iron-400 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              <ArrowTopRightOnSquareIcon
                aria-hidden="true"
                className="tw-h-4 tw-w-4"
              />
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function NftMarketActivity({
  contract,
  tokenId,
  wallet,
  filter = "all",
  pageSize = 50,
  compact = false,
  locale: localeOverride,
}: Readonly<Props>) {
  const browserLocale = useBrowserLocale();
  const locale = localeOverride ?? browserLocale;
  const { nfts, nextgenCollections } = useNFTCollections();
  const query = useInfiniteQuery({
    queryKey: [
      QueryKey.NFT_MARKET_ACTIVITY,
      contract ?? "",
      tokenId ?? "",
      wallet ?? "",
      filter,
      pageSize,
    ],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      commonApiFetch<ApiNftActivityPage>({
        endpoint: "nft-activity",
        signal,
        includeWalletAuth: false,
        params: {
          ...(contract ? { contract } : {}),
          ...(tokenId ? { token_id: tokenId } : {}),
          ...(wallet ? { wallet } : {}),
          filter,
          page_size: String(Math.min(100, Math.max(1, pageSize))),
          ...(pageParam ? { cursor: pageParam } : {}),
        },
      }),
    getNextPageParam: (page) => page.next ?? undefined,
  });

  const events = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages ?? []).flatMap((page) =>
      page.data.filter((event) => {
        if (seen.has(event.event_id)) return false;
        seen.add(event.event_id);
        return true;
      })
    );
  }, [query.data?.pages]);
  const historyStartedAt = query.data?.pages[0]?.market_history_started_at;

  const initialError = query.isError && events.length === 0;
  const isEmpty = !query.isPending && !initialError && events.length === 0;
  let statusMessage = "";
  if (query.isPending) {
    statusMessage = t(locale, "nftActivity.loading");
  } else if (initialError) {
    statusMessage = t(locale, "nftActivity.error");
  } else if (isEmpty) {
    statusMessage = t(locale, "nftActivity.empty");
  }

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="tw-sr-only"
      >
        {statusMessage}
      </div>
      {query.isPending && (
        <p className="tw-py-5 tw-text-iron-400">
          {t(locale, "nftActivity.loading")}
        </p>
      )}
      {initialError && (
        <div
          role="alert"
          className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-py-5 tw-text-error"
        >
          <span>{t(locale, "nftActivity.error")}</span>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-800 tw-px-3 tw-py-2 tw-font-semibold tw-text-white hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {t(locale, "nftActivity.retry")}
          </button>
        </div>
      )}
      {isEmpty && (
        <p className="tw-py-5 tw-text-iron-400">
          {t(locale, "nftActivity.empty")}
        </p>
      )}
      {events.length > 0 && (
        <div className={compact ? "tw-min-w-0" : "tw-min-w-0 tw-pt-3"}>
          <div
            role="region"
            aria-label={t(locale, "nftActivity.scrollRegion")}
            tabIndex={0}
            className="tw-relative tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/10 before:tw-content-none after:tw-content-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 [&_*]:before:tw-content-none [&_*]:after:tw-content-none"
          >
            <table
              className="tw-w-full tw-min-w-[980px] tw-border-collapse"
              aria-label={t(locale, "nftActivity.tableLabel")}
            >
              <thead className="tw-bg-black/20">
                <tr className="tw-border-b tw-border-solid tw-border-white/20 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
                  <th scope="col" className="tw-px-3 tw-py-2">
                    {t(locale, "nftActivity.action")}
                  </th>
                  <th scope="col" className="tw-px-3 tw-py-2">
                    {t(locale, "nftActivity.item")}
                  </th>
                  <th scope="col" className="tw-px-3 tw-py-2">
                    {t(locale, "nftActivity.maker")}
                  </th>
                  <th scope="col" className="tw-px-3 tw-py-2">
                    {t(locale, "nftActivity.recipient")}
                  </th>
                  <th scope="col" className="tw-px-3 tw-py-2">
                    {t(locale, "nftActivity.totalPrice")}
                  </th>
                  <th scope="col" className="tw-px-3 tw-py-2">
                    {t(locale, "nftActivity.date")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <EventRow
                    key={event.event_id}
                    event={event}
                    nfts={nfts}
                    nextgenCollections={nextgenCollections}
                    locale={locale}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {query.isFetchNextPageError && (
            <div
              role="alert"
              className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-3 tw-py-3 tw-text-error"
            >
              <span>{t(locale, "nftActivity.moreError")}</span>
              <button
                type="button"
                onClick={() => void query.fetchNextPage()}
                className="tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-800 tw-px-3 tw-py-2 tw-font-semibold tw-text-white hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              >
                {t(locale, "nftActivity.retry")}
              </button>
            </div>
          )}
          {query.hasNextPage && !query.isFetchNextPageError && (
            <div className="tw-py-3 tw-text-center">
              <button
                type="button"
                disabled={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
                className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-white/20 tw-bg-iron-900 tw-px-4 tw-py-2 tw-font-semibold tw-text-white hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-60"
              >
                {query.isFetchingNextPage
                  ? t(locale, "nftActivity.loadingMore")
                  : t(locale, "nftActivity.loadMore")}
              </button>
            </div>
          )}
          {historyStartedAt && (
            <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-500">
              {t(locale, "nftActivity.marketHistory", {
                date: formatDate(locale, historyStartedAt, {
                  dateStyle: "medium",
                }),
              })}
            </p>
          )}
        </div>
      )}
    </>
  );
}
