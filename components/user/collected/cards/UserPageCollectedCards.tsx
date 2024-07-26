import { CollectedCard } from "../../../../entities/IProfile";
import CommonTablePagination from "../../../utils/table/paginator/CommonTablePagination";
import { ProfileCollectedFilters } from "../UserPageCollected";
import UserPageCollectedCard from "./UserPageCollectedCard";
import UserPageCollectedCardsNoCards from "./UserPageCollectedCardsNoCards";

export default function UserPageCollectedCards({
  cards,
  totalPages,
  page,
  showDataRow,
  filters,
  setPage,
}: {
  readonly cards: CollectedCard[];
  readonly totalPages: number;
  readonly page: number;
  readonly showDataRow: boolean;
  readonly filters: ProfileCollectedFilters;
  readonly setPage: (page: number) => void;
}) {
  return (
    <div>
      {cards.length ? (
        <div className="tw-flow-root">
          <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 md:tw-grid-cols-4 tw-gap-4 lg:tw-gap-6 tw-pb-2">
            {cards.map((card) => (
              <UserPageCollectedCard
                key={`${card.collection}-${card.token_id}`}
                card={card}
                showDataRow={showDataRow}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <CommonTablePagination
              currentPage={page}
              setCurrentPage={setPage}
              totalPages={totalPages}
              haveNextPage={page < totalPages}
              small={false}
              loading={false}
            />
          )}
        </div>
      ) : (
        <UserPageCollectedCardsNoCards filters={filters} />
      )}
    </div>
  );
}
