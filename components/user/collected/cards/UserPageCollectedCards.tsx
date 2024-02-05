import { CollectedCard } from "../../../../entities/IProfile";
import CommonTablePagination from "../../../utils/CommonTablePagination";
import UserPageCollectedCard from "./UserPageCollectedCard";

export default function UserPageCollectedCards({
  cards,
  totalPages,
  page,
  showDataRow,
  setPage,
}: {
  readonly cards: CollectedCard[];
  readonly totalPages: number;
  readonly page: number;
  readonly showDataRow: boolean;
  readonly setPage: (page: number) => void;
}) {
  return (
    <div>
      {cards.length ? (
        <div className="tw-flow-root">
          <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 md:tw-grid-cols-4 tw-gap-6 tw-pb-2">
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
              small={false}
              loading={false}
            />
          )}
        </div>
      ) : (
        <div className="tw-py-4 tw-text-sm tw-italic tw-text-iron-500">
          No cards found
        </div>
      )}
    </div>
  );
}
