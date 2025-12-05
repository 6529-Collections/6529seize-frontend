import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageCollected from "@/components/user/collected/UserPageCollected";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.COLLECTED];

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  metaLabel: TAB_CONFIG.metaLabel,
  Tab: UserPageCollected,
  enableTransfer: true,
});

export default Page;
export { generateMetadata };
