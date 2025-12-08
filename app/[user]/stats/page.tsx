import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageStats from "@/components/user/stats/UserPageStats";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";

function StatsTab({ profile }: { readonly profile: ApiIdentity }) {
  return <UserPageStats profile={profile} />;
}

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.STATS];

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  metaLabel: TAB_CONFIG.metaLabel,
  Tab: StatsTab,
});

export default Page;
export { generateMetadata };
