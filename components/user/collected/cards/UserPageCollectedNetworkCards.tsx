import {
  COLLECTED_COLLECTION_TYPE_TO_CONTRACT,
  CollectedCollectionType,
} from "@/entities/IProfile";
import { areEqualAddresses } from "@/helpers/Helpers";
import {
  buildCollectedCardHref,
  getCollectedCardAnchorId,
} from "@/helpers/profile-collected-navigation";
import { COLLECTED_COLLECTIONS_META } from "../filters/user-page-collected-filters.helpers";
import { useCollectedCardScrollRestoration } from "../hooks/useCollectedCardScrollRestoration";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import type { ApiXTdhToken } from "@/generated/models/ApiXTdhToken";
import { formatNumber } from "@/i18n/format";
import Link from "next/link";
import { useTokenMetadataQuery } from "@/hooks/useAlchemyNftQueries";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";
import type { TokenMetadata } from "@/types/nft";
import Image from "next/image";
import { useMemo, useState } from "react";

const NETWORK_CARDS_LIST_CLASS =
  "tw-m-0 tw-grid tw-list-none tw-grid-cols-[repeat(auto-fill,minmax(min(100%,9rem),1fr))] tw-gap-4 tw-pb-2 tw-pl-0 sm:tw-grid-cols-3 md:tw-grid-cols-4 lg:tw-gap-6";
// CSS marker removal can cause Safari/VoiceOver to drop native list semantics.
const NETWORK_CARDS_LIST_COMPATIBILITY_PROPS = {
  role: "list",
} as const;

export default function UserPageCollectedNetworkCards({
  cards,
  page,
  setPage,
  next,
  locale = DEFAULT_LOCALE,
  returnTo,
}: {
  readonly cards: ApiXTdhToken[];
  readonly page: number;
  readonly setPage: (page: number) => void;
  readonly next: boolean;
  readonly locale?: SupportedLocale | undefined;
  readonly returnTo?: string | null | undefined;
}) {
  useCollectedCardScrollRestoration(cards);
  const tokens = useMemo(
    () =>
      cards.map((card) => ({
        contract: card.contract,
        tokenId: card.token.toString(),
      })),
    [cards]
  );

  const { data: metadata } = useTokenMetadataQuery({
    tokens,
    enabled: cards.length > 0,
  });

  const listLabel = translate(locale, "user.collected.networkCards.listLabel");
  const emptyText = translate(locale, "user.collected.networkCards.empty");

  if (cards.length === 0) {
    return (
      <output className="tw-block tw-w-full tw-py-10 tw-text-center tw-text-iron-400">
        {emptyText}
      </output>
    );
  }

  return (
    <div className="tw-w-full tw-min-w-0">
      <ul
        {...NETWORK_CARDS_LIST_COMPATIBILITY_PROPS}
        aria-label={listLabel}
        className={NETWORK_CARDS_LIST_CLASS}
      >
        {cards.map((card) => (
          <li
            key={`${card.contract}-${card.token}`}
            id={getNetworkCardAnchor(card)}
            className="tw-min-w-0 tw-scroll-mt-24 tw-list-none"
          >
            <NetworkCard
              card={card}
              metadata={metadata}
              locale={locale}
              returnTo={returnTo}
            />
          </li>
        ))}
      </ul>
      <div className="tw-mt-4">
        <CommonTablePagination
          className="[&>div>span]:tw-flex-wrap [&>div>span]:tw-gap-3 [&>div]:tw-flex-wrap [&>div]:tw-gap-3 [&_button]:tw-min-h-11"
          currentPage={page}
          setCurrentPage={setPage}
          totalPages={next ? page + 1 : page}
          haveNextPage={next}
          small={false}
          loading={false}
        />
      </div>
    </div>
  );
}

function formatNetworkStat(value: number, locale: SupportedLocale): string {
  if (!Number.isFinite(value)) return "-";
  return formatNumber(locale, Math.floor(value * 10) / 10, {
    maximumFractionDigits: 1,
  });
}

function getNativeCollection(
  contract: string
): CollectedCollectionType | undefined {
  return Object.values(CollectedCollectionType).find(
    (collection) =>
      collection !== CollectedCollectionType.NETWORK &&
      areEqualAddresses(
        COLLECTED_COLLECTION_TYPE_TO_CONTRACT[collection],
        contract
      )
  );
}

function getNetworkCardAnchor(card: ApiXTdhToken): string | undefined {
  const collection = getNativeCollection(card.contract);
  return collection !== undefined
    ? getCollectedCardAnchorId({ collection, tokenId: card.token })
    : undefined;
}

function NetworkCard({
  card,
  metadata,
  locale,
  returnTo,
}: {
  readonly card: ApiXTdhToken;
  readonly metadata: TokenMetadata[] | undefined;
  readonly locale: SupportedLocale;
  readonly returnTo?: string | null | undefined;
}) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  const tokenMetadata = metadata?.find(
    (m) =>
      m.tokenIdRaw === card.token.toString() &&
      m.contract?.toLowerCase() === card.contract.toLowerCase()
  );

  const imageUrl = tokenMetadata?.imageUrl;
  const hasImageUrl = typeof imageUrl === "string" && imageUrl.length > 0;
  const tokenName =
    tokenMetadata?.name ??
    translate(locale, "user.collected.networkCards.defaultTokenName", {
      tokenId: card.token,
    });
  const collectionName =
    tokenMetadata?.collectionName ??
    translate(locale, "user.collected.networkCards.defaultCollection");
  const imageAlt = translate(locale, "user.collected.networkCards.imageAlt", {
    name: tokenName,
  });
  const tokenLabel = translate(
    locale,
    "user.collected.networkCards.tokenLabel",
    {
      tokenId: card.token,
    }
  );
  const xtdhLabel = translate(locale, "user.collected.networkCards.xtdh");
  const xtdhRateLabel = translate(
    locale,
    "user.collected.networkCards.xtdhPerDay"
  );

  const nativeCollection = getNativeCollection(card.contract);
  const href =
    nativeCollection !== undefined
      ? buildCollectedCardHref({
          tokenPath: `${COLLECTED_COLLECTIONS_META[nativeCollection].cardPath}/${card.token}`,
          collection: nativeCollection,
          tokenId: card.token,
          returnTo,
        })
      : `https://opensea.io/assets/ethereum/${encodeURIComponent(card.contract)}/${encodeURIComponent(card.token)}`;
  const openLabel = translate(
    locale,
    nativeCollection !== undefined
      ? "user.collected.networkCards.openArtwork"
      : "user.collected.networkCards.open"
  );

  return (
    <Link
      href={href}
      target={nativeCollection !== undefined ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="tw-group tw-relative tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.02] tw-no-underline tw-shadow-xl tw-transition-all tw-duration-300 hover:tw-border-white/30 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      aria-label={translate(
        locale,
        nativeCollection !== undefined
          ? "user.collected.networkCards.openArtworkLabel"
          : "user.collected.networkCards.openLabel",
        { name: tokenName }
      )}
    >
      <div className="tw-flex tw-flex-wrap">
        <div className="tw-w-full tw-max-w-full">
          <div className="tw-relative tw-flex tw-aspect-square tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-white/[0.02]">
            {hasImageUrl && !isImageLoaded && !hasImageError && (
              <div className="tw-absolute tw-inset-0 tw-animate-pulse tw-bg-iron-800" />
            )}
            {(!hasImageUrl || hasImageError) && (
              <span className="tw-p-3 tw-text-center tw-text-xs tw-text-iron-400">
                {translate(
                  locale,
                  "user.collected.networkCards.imageUnavailable"
                )}
              </span>
            )}
            {hasImageUrl && !hasImageError && (
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                onLoad={() => setIsImageLoaded(true)}
                onError={() => setHasImageError(true)}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                unoptimized
                className={[
                  "tw-bg-transparent tw-object-contain",
                  isImageLoaded ? "tw-opacity-100" : "tw-opacity-0",
                  "tw-transition-opacity tw-duration-300",
                ].join(" ")}
              />
            )}
          </div>
        </div>

        <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-px-3 tw-pt-4">
          <span className="tw-mr-2 tw-truncate tw-text-xs tw-font-bold tw-uppercase tw-tracking-wider tw-text-iron-400">
            {collectionName}
          </span>
          <span className="tw-break-all tw-font-mono tw-text-xs tw-font-medium tw-text-iron-400">
            {tokenLabel}
          </span>
        </div>
      </div>

      <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-gap-1.5 tw-self-end tw-px-3 tw-pb-3 tw-pt-1.5">
        <div className="tw-flex tw-justify-between tw-gap-x-2">
          <span className="tw-block tw-w-full tw-break-words tw-text-sm tw-font-semibold tw-leading-snug tw-text-white/90 tw-transition-colors group-hover:tw-text-white">
            {tokenName}
          </span>
        </div>

        <dl className="tw-mb-0 tw-mt-2 tw-grid tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-2.5 tw-text-xs">
          <div className="tw-flex tw-flex-wrap tw-justify-between tw-gap-x-2">
            <dt className="tw-font-normal tw-text-iron-400">{xtdhLabel}</dt>
            <dd className="tw-m-0 tw-break-all tw-font-semibold tw-tabular-nums tw-text-iron-200">
              {formatNetworkStat(card.xtdh, locale)}
            </dd>
          </div>
          <div className="tw-flex tw-flex-wrap tw-justify-between tw-gap-x-2">
            <dt className="tw-font-normal tw-text-iron-400">{xtdhRateLabel}</dt>
            <dd className="tw-m-0 tw-break-all tw-font-semibold tw-tabular-nums tw-text-iron-200">
              {formatNetworkStat(card.xtdh_rate, locale)}
            </dd>
          </div>
        </dl>
        <span className="tw-mt-2 tw-inline-flex tw-min-h-11 tw-items-center tw-text-xs tw-font-medium tw-text-primary-300">
          {openLabel}
          {nativeCollection === undefined && (
            <span aria-hidden="true" className="tw-ml-1">
              ↗
            </span>
          )}
        </span>
      </div>
    </Link>
  );
}
