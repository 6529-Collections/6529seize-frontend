import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import { ApiXTdhToken } from "@/generated/models/ApiXTdhToken";
import { formatNumberWithCommas } from "@/helpers/Helpers";

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

  return (
    <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 xl:tw-grid-cols-5 tw-gap-4 tw-w-full">
      {cards.map((card) => (
        <div
          key={`${card.contract}-${card.token}`}
          className="tw-bg-iron-900 tw-rounded-xl tw-p-4 tw-flex tw-flex-col tw-gap-y-2 tw-border tw-border-iron-800">
          <div className="tw-flex tw-justify-between tw-items-center">
            <span className="tw-text-iron-400 tw-text-xs">Token ID</span>
            <span className="tw-text-white tw-font-medium">
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
