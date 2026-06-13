import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import type { CollectedCard } from "@/entities/IProfile";
import {
  COLLECTED_COLLECTION_TYPE_TO_CONTRACT,
  COLLECTED_COLLECTION_TYPE_TO_CONTRACT_TYPE,
} from "@/entities/IProfile";
import type { ProfileCollectedFilters } from "../UserPageCollected";
import UserPageCollectedCard from "./UserPageCollectedCard";
import UserPageCollectedCardsNoCards from "./UserPageCollectedCardsNoCards";

import {
  buildTransferKey,
  useTransfer,
} from "@/components/nft-transfer/TransferState";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";
import type { ContractType } from "@/types/enums";

const COLLECTED_CARDS_LIST_CLASS =
  "tw-m-0 tw-grid tw-grid-cols-2 tw-gap-4 tw-pb-2 tw-pl-0 sm:tw-grid-cols-3 md:tw-grid-cols-4 lg:tw-gap-6";
const COLLECTED_CARDS_LIST_LABEL = translate(
  DEFAULT_LOCALE,
  "user.collected.cards.listLabel"
);

export default function UserPageCollectedCards({
  cards,
  totalPages,
  page,
  showDataRow,
  filters,
  setPage,
  dataTransfer,
  isTransferLoading = false,
}: {
  readonly cards: CollectedCard[];
  readonly totalPages: number;
  readonly page: number;
  readonly showDataRow: boolean;
  readonly filters: ProfileCollectedFilters;
  readonly setPage: (page: number) => void;
  readonly dataTransfer: CollectedCard[];
  readonly isTransferLoading?: boolean | undefined;
}) {
  const transfer = useTransfer();
  const isTransferEnabled = transfer.enabled;

  return (
    <div>
      {cards.length ? (
        <div className="tw-flow-root">
          <ul
            role="list"
            aria-label={COLLECTED_CARDS_LIST_LABEL}
            className={COLLECTED_CARDS_LIST_CLASS}
          >
            {cards.map((card) => {
              const selKey = buildTransferKey({
                collection: card.collection,
                tokenId: card.token_id,
                fallback: `${card.collection}-${card.token_id}`,
              });
              const selected = transfer.isSelected(selKey);
              const selectedItem = transfer.selected.get(selKey);
              const dataTransferItem = dataTransfer?.find(
                (item: CollectedCard) =>
                  item.token_id === card.token_id &&
                  item.collection === card.collection
              );
              const max = dataTransferItem?.seized_count ?? 0;
              const qty = selectedItem?.qty ?? 0;
              const contractType = COLLECTED_COLLECTION_TYPE_TO_CONTRACT_TYPE[
                card.collection
              ] as ContractType;

              return (
                <li
                  key={`${card.collection}-${card.token_id}`}
                  className="tw-min-w-0 tw-list-none"
                >
                  <UserPageCollectedCard
                    card={card}
                    contractType={contractType}
                    showDataRow={showDataRow}
                    interactiveMode={isTransferEnabled ? "select" : "link"}
                    selected={selected}
                    copiesMax={max}
                    qtySelected={qty}
                    isTransferLoading={isTransferLoading}
                    onToggle={() =>
                      transfer.toggleSelect({
                        key: selKey,
                        contract:
                          COLLECTED_COLLECTION_TYPE_TO_CONTRACT[
                            card.collection
                          ],
                        contractType,
                        tokenId: card.token_id,
                        title: card.token_name,
                        thumbUrl: card.img,
                        max,
                      })
                    }
                    onIncQty={() => transfer.incQty(selKey)}
                    onDecQty={() => transfer.decQty(selKey)}
                  />
                </li>
              );
            })}
          </ul>
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
