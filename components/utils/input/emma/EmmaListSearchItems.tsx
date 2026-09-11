"use client";

import { useContext, useMemo } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { useQuery } from "@tanstack/react-query";
import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import EmmaListSearchItemsContent from "./EmmaListSearchItemsContent";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
export default function EmmaListSearchItems({
  open,
  searchCriteria,
  selectedId,
  onSelect,
  loadingLabel = "Loading...",
  noResultsLabel = "No results",
}: {
  readonly open: boolean;
  readonly searchCriteria: string | null;
  readonly selectedId: string | null;
  readonly onSelect: (item: AllowlistDescription) => void;
  readonly loadingLabel?: string;
  readonly noResultsLabel?: string;
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
      const response =
        await distributionPlanApiFetch<AllowlistDescription[]>("/allowlists");
      return response.data ?? [];
    },
    enabled: !!connectedProfile?.handle && open,
  });

  const items = useMemo(() => {
    if (!data?.length) {
      return [];
    }
    if (!searchCriteria) {
      return data;
    }
    const search = searchCriteria.toLowerCase();
    return data.filter((item) => item.name.toLowerCase().includes(search));
  }, [data, searchCriteria]);
  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait" initial={false}>
        {open && (
          <m.div
            className="tw-absolute tw-z-10 tw-mt-1 tw-w-full tw-rounded-lg tw-bg-iron-800 tw-shadow-xl tw-ring-1 tw-ring-black tw-ring-opacity-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="tw-absolute tw-z-10 tw-mt-1 tw-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
              <div className="tw-flow-root tw-overflow-y-auto tw-overflow-x-hidden tw-py-1">
                <ul className="tw-mx-0 tw-mb-0 tw-flex tw-list-none tw-flex-col tw-gap-y-1 tw-px-2">
                  <EmmaListSearchItemsContent
                    selectedId={selectedId}
                    loading={isFetching}
                    items={items}
                    onSelect={onSelect}
                    loadingLabel={loadingLabel}
                    noResultsLabel={noResultsLabel}
                  />
                </ul>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
