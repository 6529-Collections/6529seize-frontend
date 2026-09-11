import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import { AnimatePresence, motion } from "framer-motion";
import GroupCreateIdentitiesSearchItemsContent from "./GroupCreateIdentitiesSearchItemsContent";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

export type GroupCreateIdentitiesSearchResultsLayout = "popover" | "inline";
export type GroupCreateIdentitiesSearchAppearance = "default" | "modal";
export type CommunityMemberSearchSort = "level";

export const GROUP_IDENTITY_MIN_SEARCH_LENGTH = 3;

function GroupCreateIdentitiesSearchItems({
  open,
  searchCriteria,
  selectedWallets,
  resultsLayout = "popover",
  appearance = "default",
  sort,
  onSelect,
}: {
  readonly open: boolean;
  readonly searchCriteria: string | null;
  readonly selectedWallets: string[];
  readonly resultsLayout?: GroupCreateIdentitiesSearchResultsLayout;
  readonly appearance?: GroupCreateIdentitiesSearchAppearance | undefined;
  readonly sort?: CommunityMemberSearchSort | undefined;
  readonly onSelect: (item: CommunityMemberMinimal) => void;
}) {
  const normalizedSearchCriteria = searchCriteria?.trim() ?? "";
  const queryParams = {
    param: normalizedSearchCriteria,
    only_profile_owners: "true",
    ...(sort ? { sort } : {}),
  };
  const { data, isFetching } = useQuery<CommunityMemberMinimal[]>({
    queryKey: [QueryKey.PROFILE_SEARCH, queryParams],
    queryFn: async () =>
      await commonApiFetch<CommunityMemberMinimal[]>({
        endpoint: "community-members",
        params: queryParams,
      }),
    enabled:
      normalizedSearchCriteria.length >= GROUP_IDENTITY_MIN_SEARCH_LENGTH,
  });

  const isModal = appearance === "modal";
  const inlineMarginClasses = isModal ? "tw-mt-1" : "tw-mt-2";
  const wrapperClasses =
    resultsLayout === "inline"
      ? `tw-w-full ${inlineMarginClasses}`
      : "tw-absolute tw-left-0 tw-top-full tw-z-[60] tw-mt-2 tw-w-full";
  const panelClasses = isModal
    ? "tw-w-full tw-overflow-hidden"
    : "tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-shadow-2xl tw-shadow-black/30";
  const scrollClasses = isModal
    ? "tw-flow-root tw-max-h-52 tw-overflow-x-hidden tw-overflow-y-auto tw-py-1 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700 desktop-hover:hover:tw-scrollbar-thumb-iron-500"
    : "tw-flow-root tw-max-h-64 tw-overflow-x-hidden tw-overflow-y-auto tw-p-1.5 tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-600 desktop-hover:hover:tw-scrollbar-thumb-iron-400";

  const results = open ? (
    <motion.div
      className={wrapperClasses}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
    >
      <div className={panelClasses}>
        <div className={scrollClasses}>
          <ul
            className={`tw-m-0 tw-flex tw-list-none tw-flex-col tw-p-0 ${
              isModal ? "" : "tw-gap-y-1"
            }`}
          >
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
  ) : null;

  if (resultsLayout === "inline") {
    return results;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {results}
    </AnimatePresence>
  );
}

export default GroupCreateIdentitiesSearchItems;
