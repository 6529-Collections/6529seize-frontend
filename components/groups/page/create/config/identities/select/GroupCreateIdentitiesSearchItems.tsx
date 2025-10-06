import { CommunityMemberMinimal } from "@/entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import { AnimatePresence, motion } from "framer-motion";
import GroupCreateIdentitiesSearchItemsContent from "./GroupCreateIdentitiesSearchItemsContent";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

function GroupCreateIdentitiesSearchItems({
  open,
  searchCriteria,
  selectedWallets,
  onSelect,
}: {
  readonly open: boolean;
  readonly searchCriteria: string | null;
  readonly selectedWallets: string[];
  readonly onSelect: (item: CommunityMemberMinimal) => void;
}) {
  const { data, isFetching } = useQuery<CommunityMemberMinimal[]>({
    queryKey: [
      QueryKey.PROFILE_SEARCH,
      {
        param: searchCriteria,
        only_profile_owners: "true",
      },
    ],
    queryFn: async () =>
      await commonApiFetch<CommunityMemberMinimal[]>({
        endpoint: "community-members",
        params: {
          param: searchCriteria ?? "",
          only_profile_owners: "true",
        },
      }),
    enabled: !!searchCriteria && searchCriteria.length >= 3,
  });

  return (
    <AnimatePresence mode="wait" initial={false}>
      {open && (
        <motion.div
          className="tw-absolute tw-z-[60] tw-mt-1 tw-w-full tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="tw-absolute tw-z-[60] tw-mt-1 tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
            <div className="tw-py-1 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto tw-max-h-64 tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
              <ul className="tw-flex tw-flex-col tw-gap-y-1 tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                <GroupCreateIdentitiesSearchItemsContent
                  selectedWallets={selectedWallets}
                  loading={isFetching}
                  items={data ?? []}
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

export default GroupCreateIdentitiesSearchItems;
