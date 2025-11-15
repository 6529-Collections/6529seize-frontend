import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";
import UserPageXtdh from "@/components/user/xtdh/UserPageXtdh";

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.XTDH];

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  metaLabel: TAB_CONFIG.metaLabel,
  Tab: UserPageXtdh,
});

export default Page;
export { generateMetadata };
