import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import type { ApiXTdhToken } from "@/generated/models/ApiXTdhToken";
import { formatStatFloor } from "@/helpers/Helpers";
import { useTokenMetadataQuery } from "@/hooks/useAlchemyNftQueries";
import { useMemo, useState } from "react";

export default function UserPageCollectedNetworkCards({
  cards,
  page,
  setPage,
  next,
}: {
  readonly cards: ApiXTdhToken[];
  readonly page: number;
  readonly setPage: (page: number) => void;
  readonly next: boolean;
}) {
  if (!cards.length) {
    return (
      <div className="tw-w-full tw-py-10 tw-text-center tw-text-iron-400">
        No tokens found
      </div>
    );
  }

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

  return (
    <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-pb-2 sm:tw-grid-cols-3 md:tw-grid-cols-4 lg:tw-gap-6">
      {cards.map((card) => (
        <NetworkCard
          key={`${card.contract}-${card.token}`}
          card={card}
          metadata={metadata}
        />
      ))}
      <div className="tw-col-span-full tw-mt-4">
        <CommonTablePagination
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

function NetworkCard({
  card,
  metadata,
}: {
  readonly card: ApiXTdhToken;
  readonly metadata: any[] | undefined;
}) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const tokenMetadata = metadata?.find(
    (m) =>
      m.tokenIdRaw === card.token.toString() &&
      m.contract?.toLowerCase() === card.contract.toLowerCase()
  );

  const imageUrl = tokenMetadata?.imageUrl;

  return (
    <div className="tw-group tw-relative tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.02] tw-shadow-xl tw-transition-all tw-duration-300 hover:tw-border-white/30">
      <div className="tw-flex tw-flex-wrap">
        <div className="tw-w-full tw-max-w-full">
          <div className="tw-relative tw-flex tw-aspect-square tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-white/[0.02]">
            {!isImageLoaded && (
              <div className="tw-absolute tw-inset-0 tw-animate-pulse tw-bg-iron-800" />
            )}
            {imageUrl && (
              <img
                src={imageUrl}
                alt={tokenMetadata?.collectionName ?? "Network Token"}
                onLoad={() => setIsImageLoaded(true)}
                className={[
                  "tw-mx-auto tw-h-auto tw-max-h-full tw-w-auto tw-max-w-full tw-bg-transparent tw-object-contain",
                  !isImageLoaded ? "tw-opacity-0" : "tw-opacity-100",
                  "tw-transition-opacity tw-duration-300",
                ].join(" ")}
              />
            )}
          </div>
        </div>

        <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-px-4 tw-pt-4">
          <span className="tw-mr-2 tw-truncate tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-white/40">
            {tokenMetadata?.collectionName ?? "Network"}
          </span>
          <span className="tw-font-mono tw-text-[11px] tw-font-medium tw-text-white/50">
            #{card.token}
          </span>
        </div>
      </div>

      <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-gap-1.5 tw-self-end tw-px-4 tw-pb-4 tw-pt-1.5">
        <div className="tw-flex tw-justify-between tw-gap-x-2">
          <span className="tw-block tw-w-full tw-truncate tw-text-[14px] tw-font-semibold tw-leading-snug tw-text-white/90 tw-transition-colors group-hover:tw-text-white">
            {tokenMetadata?.name ?? `Token #${card.token}`}
          </span>
        </div>

        <div className="tw-mt-2 tw-grid tw-grid-cols-2 tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-pt-2.5">
          <span className="tw-flex tw-items-baseline tw-gap-1.5 tw-text-[13px] tw-font-semibold">
            <span className="tw-order-2 tw-text-white/30">xTDH</span>
            <span className="tw-order-1 tw-text-white/80">
              {formatStatFloor(card.xtdh, 1)}
            </span>
          </span>
          <span className="tw-flex tw-items-baseline tw-justify-end tw-gap-1.5 tw-text-[13px] tw-font-semibold">
            <span className="tw-order-2 tw-text-white/30">xTDH/day</span>
            <span className="tw-order-1 tw-text-white/80">
              {formatStatFloor(card.xtdh_rate, 1)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
