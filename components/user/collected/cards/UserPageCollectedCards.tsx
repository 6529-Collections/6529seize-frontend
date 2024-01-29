import { CollectedCard } from "../../../../entities/IProfile";
import CommonTablePagination from "../../../utils/CommonTablePagination";
import UserPageCollectedCard from "./UserPageCollectedCard";

export default function UserPageCollectedCards({
  cards,
  totalPages,
  page,
  setPage,
}: {
  readonly cards: CollectedCard[];
  readonly totalPages: number;
  readonly page: number;
  readonly setPage: (page: number) => void;
}) {
  return (
    <div className="tw-mt-6 lg:tw-mt-8">
      {cards.length ? (
        <div className="tw-flow-root">
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 xl:tw-grid-cols-4 2xl:tw-grid-cols-5 3xl:tw-grid-cols-6 tw-gap-6 tw-pb-2">
            {cards.map((card) => (
              <UserPageCollectedCard
                card={card}
                key={`${card.collection}-${card.token_id}`}
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
