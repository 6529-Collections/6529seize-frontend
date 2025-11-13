import { useEffect, useState } from "react";

import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";

import type {
  GrantedFilterStatuses,
  GrantedStatusCounts,
} from "../types";
import { DEFAULT_STATUS } from "../constants";

interface UseStatusCountsParams {
  readonly activeStatuses: GrantedFilterStatuses;
  readonly data: ApiTdhGrantsPage | undefined;
  readonly grantor: string;
}

/**
 * Maintains per-status counts driven by the most recent API response.
 */
export function useUserPageXtdhGrantedListStatusCounts({
  activeStatuses,
  data,
  grantor,
}: UseStatusCountsParams): GrantedStatusCounts {
  const [statusCounts, setStatusCounts] = useState<GrantedStatusCounts>({});

  useEffect(() => {
    setStatusCounts({});
  }, [grantor]);

  useEffect(() => {
    if (!data) return;
    if (activeStatuses.length !== 1) {
      return;
    }

    const [status] = activeStatuses;

    setStatusCounts((prev) => ({
      ...prev,
      [status]: data.count,
      ...(status === DEFAULT_STATUS ? { [DEFAULT_STATUS]: data.count } : {}),
    }));
  }, [activeStatuses, data]);

  return statusCounts;
}
