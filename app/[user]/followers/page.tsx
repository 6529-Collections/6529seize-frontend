import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageFollowers from "@/components/user/followers/UserPageFollowers";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.FOLLOWERS];

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  metaLabel: TAB_CONFIG.metaLabel,
  Tab: UserPageFollowers,
});

export default Page;
export { generateMetadata };
