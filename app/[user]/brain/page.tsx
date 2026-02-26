import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageBrainWrapper from "@/components/user/brain/UserPageBrainWrapper";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.BRAIN];

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  metaLabel: TAB_CONFIG.metaLabel,
  Tab: ({ profile }) => (
    <div className="tailwind-scope">
      <UserPageBrainWrapper profile={profile} />
    </div>
  ),
});

export default Page;
export { generateMetadata };
