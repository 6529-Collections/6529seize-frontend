import type { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "../query-keys";

export function invalidateRepCategoryAnalytics(queryClient: QueryClient): void {
  [
    QueryKey.GLOBAL_REP_CATEGORY_SEARCH,
    QueryKey.GLOBAL_REP_CATEGORY_SUGGESTED,
    QueryKey.GLOBAL_REP_CATEGORY_OVERVIEW,
    QueryKey.GLOBAL_REP_CATEGORY_PAGE,
    QueryKey.GLOBAL_REP_CATEGORY_WAVE_OVERVIEW,
    QueryKey.GLOBAL_REP_CATEGORY_WAVES_PAGE,
    QueryKey.GLOBAL_REP_CATEGORY_WAVE_CONTRIBUTORS_PAGE,
  ].forEach((queryKey) => {
    void queryClient.invalidateQueries({ queryKey: [queryKey] });
  });
}
