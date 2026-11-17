import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";
import UserPageRepWrapper from "@/components/user/rep/UserPageRepWrapper";
import type { ApiProfileRepRatesState } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  convertActivityLogParams,
  getProfileLogTypes,
} from "@/helpers/profile-logs.helpers";
import { ProfileActivityFilterTargetType, RateMatter } from "@/types/enums";

import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { loadProfileStatements } from "@/helpers/user-page.server";
import {
  nicOverviewQueryOptions,
  profileActivityLogsQueryOptions,
  repCategoriesQueryOptions,
  repOverviewQueryOptions,
} from "@/services/api/profile-page-queries";
import { profileQueryViewer } from "@/services/auth/profile-query-viewer";
import {
  dehydrate,
  defaultShouldDehydrateQuery,
  HydrationBoundary,
  QueryClient,
  type DehydratedState,
} from "@tanstack/react-query";
import { headers } from "next/headers";
import { userAgent } from "next/server";
export interface UserPageRepPropsRepRates {
  readonly ratings: ApiProfileRepRatesState;
  readonly rater: string | null;
}

const getInitialActivityLogParams = (
  handleOrWallet: string
): ActivityLogParams => ({
  page: 1,
  pageSize: 10,
  logTypes: getProfileLogTypes({
    logTypes: [],
  }),
  matter: null,
  targetType: ProfileActivityFilterTargetType.ALL,
  handleOrWallet,
  groupId: null,
});

function RepTab({
  profile,
  initialActivityLogParams,
  initialQueries,
}: {
  readonly profile: ApiIdentity;
  readonly initialActivityLogParams: ActivityLogParams;
  readonly initialQueries: DehydratedState | undefined;
}) {
  return (
    <HydrationBoundary state={initialQueries}>
      <div className="tailwind-scope">
        <UserPageRepWrapper
          profile={profile}
          initialActivityLogParams={initialActivityLogParams}
        />
      </div>
    </HydrationBoundary>
  );
}

async function prepareRepTab({
  profile,
  user,
}: {
  readonly profile: ApiIdentity;
  readonly user: string;
}) {
  const initialActivityLogParams = getInitialActivityLogParams(
    (profile.handle ?? profile.wallets?.[0]?.wallet ?? "").toLowerCase()
  );
  const [apiHeaders, requestHeaders] = await Promise.all([
    getAppCommonHeaders(),
    headers(),
  ]);
  // Reserve the initial reads for document navigation. Fetch requests can
  // reuse the browser cache, and speculative document loads may go unused.
  const fetchMode = requestHeaders.get("sec-fetch-mode");
  const isPrefetch =
    requestHeaders.get("sec-purpose")?.startsWith("prefetch") ||
    requestHeaders.get("purpose") === "prefetch";
  if (isPrefetch || (fetchMode && fetchMode !== "navigate")) {
    return { initialActivityLogParams, initialQueries: undefined };
  }
  const authorization = apiHeaders["Authorization"];
  const viewer = profileQueryViewer(
    authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null
  );
  const queryClient = new QueryClient();

  // Dehydrate pending queries so each response travels in its own RSC chunk
  // and the existing observers can join those requests after hydration.
  void queryClient.prefetchQuery(
    repOverviewQueryOptions(user, "incoming", viewer, apiHeaders)
  );
  void queryClient.prefetchInfiniteQuery(
    repCategoriesQueryOptions(user, "incoming", viewer, apiHeaders)
  );
  void queryClient.prefetchQuery(
    nicOverviewQueryOptions(user, "incoming", viewer, apiHeaders)
  );
  // The statements endpoint returns the same moderated list to every viewer.
  // Reuse the public key and the request already shared by metadata and header.
  void queryClient.prefetchQuery({
    queryKey: [QueryKey.PROFILE_CIC_STATEMENTS, user],
    queryFn: () => loadProfileStatements(user),
  });

  if (initialActivityLogParams.handleOrWallet) {
    // The browser's breakpoint remains authoritative. Guess only which page
    // to prefetch so a normal visit doesn't run both activity queries.
    const { device } = userAgent({ headers: requestHeaders });
    const mobile =
      requestHeaders.get("sec-ch-ua-mobile") === "?1" ||
      device.type === "mobile" ||
      device.type === "tablet";
    const params = convertActivityLogParams({
      params: {
        ...initialActivityLogParams,
        matter: mobile ? RateMatter.REP : null,
      },
      disableActiveGroup: false,
    });
    void queryClient.prefetchQuery(
      profileActivityLogsQueryOptions(params, viewer, apiHeaders)
    );
  }

  return {
    initialActivityLogParams,
    initialQueries: dehydrate(queryClient, {
      shouldDehydrateQuery: (query) =>
        defaultShouldDehydrateQuery(query) || query.state.status === "pending",
    }),
  };
}

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.REP];

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  Tab: RepTab,
  getTabProps: prepareRepTab,
});

export default Page;
export { generateMetadata };
