import { CancelledError } from "@tanstack/react-query";
import type { ActivityLogParamsConverted } from "@/components/profile-activity/ProfileActivityLogs";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ProfileActivityLog } from "@/entities/IProfile";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiRepCategoriesPage } from "@/generated/models/ApiRepCategoriesPage";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import type { CountlessPage } from "@/helpers/Types";
import { getCurrentProfileQueryViewer } from "@/services/auth/profile-query-viewer";
import { commonApiFetch } from "@/services/api/common-api";

type Viewer = string | null;
type Direction = "incoming" | "outgoing";
type Headers = Record<string, string>;

function fetchForViewer<T>(
  endpoint: string,
  params: object | undefined,
  viewer: Viewer,
  headers: Headers | undefined
) {
  // A refetch can start while the browser is switching accounts. Never
  // associate a response from the new account with the previous query key.
  if (headers === undefined && getCurrentProfileQueryViewer() !== viewer) {
    throw new CancelledError({ revert: true });
  }
  return commonApiFetch<T, object>({
    endpoint,
    params,
    ...(headers === undefined
      ? {}
      : { headers, cache: "no-store", includeWalletAuth: false }),
  });
}

export function repOverviewQueryOptions(
  user: string,
  direction: Direction,
  viewer: Viewer,
  headers?: Headers
) {
  return {
    queryKey: [
      QueryKey.REP_OVERVIEW,
      { handleOrWallet: user, direction },
      viewer,
    ],
    queryFn: () =>
      fetchForViewer<ApiRepOverview>(
        `profiles/${encodeURIComponent(user)}/rep/overview`,
        direction === "outgoing" ? { direction } : undefined,
        viewer,
        headers
      ),
  };
}

export function repCategoriesQueryOptions(
  user: string,
  direction: Direction,
  viewer: Viewer,
  headers?: Headers
) {
  return {
    queryKey: [
      QueryKey.REP_CATEGORIES,
      { handleOrWallet: user, direction },
      viewer,
    ],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      fetchForViewer<ApiRepCategoriesPage>(
        `profiles/${encodeURIComponent(user)}/rep/categories`,
        {
          ...(direction === "outgoing" ? { direction } : {}),
          page: pageParam.toString(),
          page_size: "25",
          top_contributors_limit: "5",
        },
        viewer,
        headers
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage: ApiRepCategoriesPage | undefined) =>
      lastPage?.next ? lastPage.page + 1 : undefined,
  };
}

export function nicOverviewQueryOptions(
  user: string,
  direction: Direction,
  viewer: Viewer,
  headers?: Headers
) {
  return {
    queryKey: [
      QueryKey.CIC_OVERVIEW,
      {
        handleOrWallet: user.toLowerCase(),
        ...(direction === "outgoing" ? { direction } : {}),
      },
      viewer,
    ],
    queryFn: () =>
      fetchForViewer<ApiCicOverview>(
        `profiles/${encodeURIComponent(user)}/cic/overview`,
        direction === "outgoing" ? { direction } : undefined,
        viewer,
        headers
      ),
  };
}

export function profileActivityLogsQueryOptions(
  params: ActivityLogParamsConverted,
  viewer: Viewer,
  headers?: Headers
) {
  return {
    queryKey: [QueryKey.PROFILE_LOGS, params, viewer],
    queryFn: () =>
      fetchForViewer<CountlessPage<ProfileActivityLog>>(
        "profile-logs",
        params,
        viewer,
        headers
      ),
  };
}
