import { useEffect, useState } from "react";

import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";

import type {
  GrantedFilterStatus,
  GrantedStatusCounts,
} from "../types";

interface UseStatusCountsParams {
  readonly activeStatus: GrantedFilterStatus;
  readonly data: ApiTdhGrantsPage | undefined;
  readonly grantor: string;
}

/**
 * Maintains per-status counts driven by the most recent API response.
 */
export function useUserPageXtdhGrantedListStatusCounts({
  activeStatus,
  data,
  grantor,
}: UseStatusCountsParams): GrantedStatusCounts {
  const [statusCounts, setStatusCounts] = useState<GrantedStatusCounts>({});

  useEffect(() => {
    setStatusCounts({});
  }, [grantor]);

  useEffect(() => {
    if (!data) return;
    setStatusCounts((prev) => ({
      ...prev,
      [activeStatus]: data.count,
      ...(activeStatus === "ALL" ? { ALL: data.count } : {}),
    }));
  }, [activeStatus, data]);

  return statusCounts;
}

