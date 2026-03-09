import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageCollected from "@/components/user/collected/UserPageCollected";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";
import { EMPTY_USER_PAGE_STATS_INITIAL_DATA } from "@/components/user/stats/userPageStats.types";
import { getUserPageStatsInitialData } from "@/components/user/stats/userPageStats.server";

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.COLLECTED];

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  metaLabel: TAB_CONFIG.metaLabel,
  Tab: UserPageCollected,
  enableTransfer: true,
  getTabProps: async ({ profile, query }) => {
    const initialStatsData = await getUserPageStatsInitialData({
      profile,
      activeAddress: query["address"],
    }).catch((error: unknown) => {
      if (
        error instanceof Error &&
        error.message === "getStatsPath: no wallet available on profile"
      ) {
        return EMPTY_USER_PAGE_STATS_INITIAL_DATA;
      }
      throw error;
    });
    return { initialStatsData };
  },
});

export default Page;
export { generateMetadata };
