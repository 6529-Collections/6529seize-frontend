import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import type { ApiXTdhToken } from "@/generated/models/ApiXTdhToken";
import { formatStatFloor } from "@/helpers/Helpers";
import { useTokenMetadataQuery } from "@/hooks/useAlchemyNftQueries";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";
import type { TokenMetadata } from "@/types/nft";
import Image from "next/image";
import { useMemo, useState } from "react";

const NETWORK_CARDS_LIST_CLASS =
  "tw-m-0 tw-grid tw-list-none tw-grid-cols-2 tw-gap-4 tw-pb-2 tw-pl-0 sm:tw-grid-cols-3 md:tw-grid-cols-4 lg:tw-gap-6";
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
}: {
  readonly cards: ApiXTdhToken[];
  readonly page: number;
  readonly setPage: (page: number) => void;
  readonly next: boolean;
  readonly locale?: SupportedLocale | undefined;
}) {
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
      <div className="tw-w-full tw-py-10 tw-text-center tw-text-iron-400">
        {emptyText}
      </div>
    );
  }

  return (
    <>
      <ul
        {...NETWORK_CARDS_LIST_COMPATIBILITY_PROPS}
        aria-label={listLabel}
        className={NETWORK_CARDS_LIST_CLASS}
      >
        {cards.map((card) => (
          <li
            key={`${card.contract}-${card.token}`}
            className="tw-min-w-0 tw-list-none"
          >
            <NetworkCard card={card} metadata={metadata} locale={locale} />
          </li>
        ))}
      </ul>
      <div className="tw-mt-4">
        <CommonTablePagination
          currentPage={page}
          setCurrentPage={setPage}
          totalPages={next ? page + 1 : page}
          haveNextPage={next}
          small={false}
          loading={false}
        />
      </div>
    </>
  );
}

function NetworkCard({
  card,
  metadata,
  locale,
}: {
  readonly card: ApiXTdhToken;
  readonly metadata: TokenMetadata[] | undefined;
  readonly locale: SupportedLocale;
}) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

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

  return (
    <div className="tw-group tw-relative tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.02] tw-shadow-xl tw-transition-all tw-duration-300 hover:tw-border-white/30">
      <div className="tw-flex tw-flex-wrap">
        <div className="tw-w-full tw-max-w-full">
          <div className="tw-relative tw-flex tw-aspect-square tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-white/[0.02]">
            {!isImageLoaded && (
              <div className="tw-absolute tw-inset-0 tw-animate-pulse tw-bg-iron-800" />
            )}
            {hasImageUrl && (
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                onLoad={() => setIsImageLoaded(true)}
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

        <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-px-4 tw-pt-4">
          <span className="tw-mr-2 tw-truncate tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-white/40">
            {collectionName}
          </span>
          <span className="tw-font-mono tw-text-[11px] tw-font-medium tw-text-white/50">
            {tokenLabel}
          </span>
        </div>
      </div>

      <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-gap-1.5 tw-self-end tw-px-4 tw-pb-4 tw-pt-1.5">
        <div className="tw-flex tw-justify-between tw-gap-x-2">
          <span className="tw-block tw-w-full tw-truncate tw-text-sm tw-font-semibold tw-leading-snug tw-text-white/90 tw-transition-colors group-hover:tw-text-white">
            {tokenName}
          </span>
        </div>

        <div className="tw-mt-2 tw-grid tw-grid-cols-2 tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-pt-2.5">
          <span className="tw-flex tw-items-baseline tw-gap-1.5 tw-text-[13px] tw-font-semibold">
            <span className="tw-order-2 tw-text-white/30">{xtdhLabel}</span>
            <span className="tw-order-1 tw-text-white/80">
              {formatStatFloor(card.xtdh, 1)}
            </span>
          </span>
          <span className="tw-flex tw-items-baseline tw-justify-end tw-gap-1.5 tw-text-[13px] tw-font-semibold">
            <span className="tw-order-2 tw-text-white/30">{xtdhRateLabel}</span>
            <span className="tw-order-1 tw-text-white/80">
              {formatStatFloor(card.xtdh_rate, 1)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
