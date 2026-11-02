import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";
import UserPageProfileWave from "@/components/user/waves/UserPageProfileWave";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

function WaveTab({ profile }: { readonly profile: ApiIdentity }) {
  return <UserPageProfileWave profile={profile} />;
}

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.WAVES];

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  Tab: WaveTab,
});

export default Page;
export { generateMetadata };
