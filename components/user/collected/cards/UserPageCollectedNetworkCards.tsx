import NFTImage from "@/components/nft-image/NFTImage";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import { NFTLite } from "@/entities/INFT";
import { ApiXTdhToken } from "@/generated/models/ApiXTdhToken";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useTokenMetadataQuery } from "@/hooks/useAlchemyNftQueries";
import { useMemo } from "react";

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
    <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 xl:tw-grid-cols-5 tw-gap-4 tw-w-full">
      {cards.map((card) => {
        const tokenMetadata = metadata?.find(
          (m) =>
            m.tokenIdRaw === card.token.toString() &&
            m.contract?.toLowerCase() === card.contract.toLowerCase()
        );

        const nftLite: NFTLite = {
          id: card.token,
          contract: card.contract,
          name: tokenMetadata?.name ?? `Token #${card.token}`,
          icon: tokenMetadata?.imageUrl ?? "",
          thumbnail: tokenMetadata?.imageUrl ?? "",
          scaled: tokenMetadata?.imageUrl ?? "",
          image: tokenMetadata?.imageUrl ?? "",
          animation: "",
        };

        return (
          <div
            key={`${card.contract}-${card.token}`}
            className="tw-bg-iron-900 tw-rounded-xl tw-p-4 tw-flex tw-flex-col tw-gap-y-4 tw-border tw-border-iron-800">
            <div className="tw-aspect-square tw-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-800">
              <NFTImage
                nft={nftLite}
                animation={false}
                height={300}
                showBalance={false}
                showThumbnail={true}
              />
            </div>
            <div className="tw-flex tw-flex-col tw-gap-y-2">
              <div className="tw-flex tw-justify-between tw-items-center">
                <span className="tw-text-iron-400 tw-text-xs">Token ID</span>
                <span className="tw-text-white tw-font-medium tw-truncate tw-max-w-[100px]" title={card.token.toString()}>
                  {card.token}
                </span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center">
                <span className="tw-text-iron-400 tw-text-xs">xTDH</span>
                <span className="tw-text-white tw-font-medium">
                  {formatNumberWithCommas(card.xtdh)}
                </span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center">
                <span className="tw-text-iron-400 tw-text-xs">xTDH/day</span>
                <span className="tw-text-white tw-font-medium">
                  {formatNumberWithCommas(card.xtdh_rate)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
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
