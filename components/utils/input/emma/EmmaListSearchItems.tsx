"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";
import { AnimatePresence, motion } from "framer-motion";
import EmmaListSearchItemsContent from "./EmmaListSearchItemsContent";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
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
      { identity: connectedProfile?.handle },
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
    enabled: !!connectedProfile?.handle && open,
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
          transition={{ duration: 0.2 }}>
          <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
            <div className="tw-py-1 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto">
              <ul className="tw-flex tw-flex-col tw-gap-y-1 tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                <EmmaListSearchItemsContent
                  selectedId={selectedId}
                  loading={isFetching}
                  items={items}
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
