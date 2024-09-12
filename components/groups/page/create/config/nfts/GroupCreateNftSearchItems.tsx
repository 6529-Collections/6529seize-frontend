import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../../../../../../services/api/common-api";
import { NFTSearchResult } from "../../../../../header/header-search/HeaderSearchModalItem";
import { QueryKey } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import { AnimatePresence, motion } from "framer-motion";
import GroupCreateNftSearchItemsContent from "./GroupCreateNftSearchItemsContent";
import { GroupOwnsNft } from "../../../../../../generated/models/GroupOwnsNft";

export default function GroupCreateNftSearchItems({
  open,
  searchCriteria,
  selected,
  onSelect,
}: {
  readonly open: boolean;
  readonly searchCriteria: string | null;
  readonly selected: GroupOwnsNft[];
  readonly onSelect: (item: NFTSearchResult) => void;
}) {
  const { isFetching, data: nfts } = useQuery({
    queryKey: [QueryKey.NFTS_SEARCH, searchCriteria],
    queryFn: async () => {
      return await commonApiFetch<NFTSearchResult[]>({
        endpoint: "nfts_search",
        params: {
          search: searchCriteria ?? "",
        },
      });
    },
    enabled:
      !!(searchCriteria && searchCriteria.length >= 3) ||
      !!(
        searchCriteria &&
        searchCriteria.length > 0 &&
        !isNaN(Number(searchCriteria))
      ),
  });

  return (
    <AnimatePresence mode="wait" initial={false}>
      {open && (
        <motion.div
          className="tw-absolute tw-z-20 tw-mt-1 tw-w-full tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="tw-absolute tw-z-20 tw-mt-1 tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
            <div className="tw-py-1 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto">
              <ul className="tw-flex tw-flex-col tw-gap-y-1 tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                <GroupCreateNftSearchItemsContent
                  loading={isFetching}
                  items={nfts ?? []}
                  selected={selected}
                  onSelect={onSelect}
                />
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
