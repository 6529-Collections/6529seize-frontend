import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { AllowlistDescription } from "../../../allowlist-tool/allowlist-tool.types";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { distributionPlanApiFetch } from "../../../../services/distribution-plan-api";
import { AnimatePresence, motion } from "framer-motion";
import EmmaListSearchItem from "./EmmaListSearchItem";

export default function EmmaListSearchItems({
  open,
  searchCriteria,
  selectedId,
  onSelect,
}: {
  readonly open: boolean;
  readonly searchCriteria: string | null;
  readonly selectedId: string | null;
  readonly onSelect: (item: AllowlistDescription) => void;
}) {
  const { connectedProfile, requestAuth } = useContext(AuthContext);
  const { data, isFetching } = useQuery<AllowlistDescription[]>({
    queryKey: [
      QueryKey.EMMA_IDENTITY_ALLOWLISTS,
      { identity: connectedProfile?.profile?.handle },
    ],
    queryFn: async () => {
      const { success } = await requestAuth();
      if (!success) {
        return [];
      }
      const response = await distributionPlanApiFetch<AllowlistDescription[]>(
        "/allowlists"
      );
      return response.data ?? [];
    },
    enabled: !!connectedProfile?.profile?.handle && open,
  });

  const [items, setItems] = useState<AllowlistDescription[]>([]);

  useEffect(() => {
    if (!data?.length) {
      setItems([]);
      return;
    }
    if (!searchCriteria) {
      setItems(data);
      return;
    }
    const search = searchCriteria.toLowerCase();
    setItems(data.filter((item) => item.name.toLowerCase().includes(search)));
  }, [data, searchCriteria]);
  return (
      <AnimatePresence mode="wait" initial={false}>
        {open && (
          <motion.div
            className="tw-absolute tw-z-10 tw-mt-1 tw-w-full tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
              <div className="tw-py-1 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto">
                <ul className="tw-flex tw-flex-col tw-gap-y-1 tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                  {isFetching ? (
                    <li className="tw-py-2 tw-w-full tw-h-full tw-flex tw-items-center tw-justify-between tw-text-sm tw-font-medium tw-text-white tw-rounded-lg tw-relative tw-select-none tw-px-2">
                      Loading...
                    </li>
                  ) : items.length ? (
                    items.map((item) => (
                      <EmmaListSearchItem
                        key={item.id}
                        item={item}
                        selectedId={selectedId}
                        onSelect={onSelect}
                      />
                    ))
                  ) : (
                    <li className="tw-py-2 tw-w-full tw-h-full tw-flex tw-items-center tw-justify-between tw-text-sm tw-font-medium tw-text-white tw-rounded-lg tw-relative tw-select-none tw-px-2">
                      No results
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
  );
}
