import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import {
  COLLECTED_COLLECTION_TYPE_TO_CONTRACT,
  COLLECTED_COLLECTION_TYPE_TO_CONTRACT_TYPE,
  CollectedCard,
} from "@/entities/IProfile";
import { ProfileCollectedFilters } from "../UserPageCollected";
import UserPageCollectedCard from "./UserPageCollectedCard";
import UserPageCollectedCardsNoCards from "./UserPageCollectedCardsNoCards";

import { ContractType } from "@/enums";
import { buildTransferKey, useTransfer } from "../transfer/TransferState";

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
  const t = useTransfer();

  const gridClasses = t.enabled
    ? "tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 tw-gap-4 lg:tw-gap-6 tw-pb-2"
    : "tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 md:tw-grid-cols-4 tw-gap-4 lg:tw-gap-6 tw-pb-2";

  return (
    <div>
      {cards.length ? (
        <div className="tw-flow-root">
          <div className={gridClasses}>
            {cards.map((card) => {
              const selKey = buildTransferKey({
                collection: card.collection,
                tokenId: card.token_id,
                fallback: `${card.collection}-${card.token_id}`,
              });
              const selected = t.isSelected(selKey);
              const selectedItem = t.selected.get(selKey);
              const max = Math.max(1, Number(card.seized_count ?? 1));
              const qty = selectedItem?.qty ?? 0;

              return (
                <UserPageCollectedCard
                  key={`${card.collection}-${card.token_id}`}
                  card={card}
                  contractType={
                    COLLECTED_COLLECTION_TYPE_TO_CONTRACT_TYPE[
                      card.collection
                    ] as ContractType
                  }
                  showDataRow={showDataRow}
                  interactiveMode={t.enabled ? "select" : "link"}
                  selected={selected}
                  copiesMax={max}
                  qtySelected={qty}
                  onToggle={() =>
                    t.toggleSelect({
                      key: selKey,
                      contract:
                        COLLECTED_COLLECTION_TYPE_TO_CONTRACT[card.collection],
                      contractType: COLLECTED_COLLECTION_TYPE_TO_CONTRACT_TYPE[
                        card.collection
                      ] as ContractType,
                      tokenId: card.token_id,
                      title: card.token_name,
                      thumbUrl: card.img,
                      max,
                    })
                  }
                />
              );
            })}
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
