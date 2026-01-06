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
      <div className="tw-w-full tw-text-center tw-py-10 tw-text-iron-400">
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
    <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 md:tw-grid-cols-4 tw-gap-4 lg:tw-gap-6 tw-pb-2">
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
    <div className="tw-group tw-relative tw-flex tw-flex-col tw-bg-gradient-to-br tw-from-iron-900 tw-to-white/5 tw-rounded-lg tw-overflow-hidden tw-px-0.5 tw-pt-0.5 tw-transition tw-duration-300 tw-ease-out tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600/60 hover:tw-to-white/10">
      <div className="tw-flex tw-flex-wrap">
        <div className="tw-w-full tw-max-w-full">
          <div className="tw-h-[200px] min-[800px]:tw-h-[250px] min-[1200px]:tw-h-[18.75rem] tw-text-center tw-flex tw-items-center tw-justify-center tw-relative tw-w-full">
            {!isImageLoaded && (
              <div className="tw-absolute tw-inset-0 tw-bg-iron-800 tw-animate-pulse tw-rounded-lg" />
            )}
            {imageUrl && (
              <img
                src={imageUrl}
                alt={tokenMetadata?.collectionName ?? "Network Token"}
                onLoad={() => setIsImageLoaded(true)}
                className={`tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain ${!isImageLoaded ? "tw-opacity-0" : "tw-opacity-100"
                  } tw-transition-opacity tw-duration-300`}
              />
            )}
          </div>
        </div>

        <div className="tw-pt-3 tw-px-2 tw-flex tw-justify-between tw-items-center tw-w-full">
          <span className="tw-text-sm min-[1200px]:tw-text-md tw-font-medium tw-text-iron-400">
            {tokenMetadata?.collectionName ?? "Network"}
          </span>
          <span className="tw-text-sm min-[1200px]:tw-text-md tw-font-medium tw-text-iron-500">
            #{card.token}
          </span>
        </div>
      </div>

      <div className="tw-pt-2 tw-pb-4 tw-px-2 tw-self-end tw-w-full tw-h-full">
        <div className="tw-flex tw-flex-col tw-h-full tw-justify-between tw-gap-y-2.5 tw-divide-y tw-divide-solid tw-divide-iron-700 tw-divide-x-0">
          <div className="tw-flex tw-justify-between tw-gap-x-2">
            <span className="tw-text-sm min-[1200px]:tw-text-md tw-font-medium tw-text-iron-50 tw-truncate tw-block tw-w-full">
              {tokenMetadata?.name ?? `Token #${card.token}`}
            </span>
          </div>

          <div className="tw-pt-2 tw-flex tw-items-center tw-justify-between">
            <span className="tw-text-sm min-[1200px]:tw-text-md tw-font-medium">
              <span className="tw-text-iron-400">xTDH</span>
              <span className="tw-ml-1 tw-text-iron-50">
                {formatStatFloor(card.xtdh, 1)}
              </span>
            </span>
            <span className="tw-text-sm min-[1200px]:tw-text-md tw-font-medium">
              <span className="tw-text-iron-400">xTDH/day</span>
              <span className="tw-ml-1 tw-text-iron-50">
                {formatStatFloor(card.xtdh_rate, 1)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
