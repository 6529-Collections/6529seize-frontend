import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageWaves from "@/components/user/waves/UserPageWaves";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";

function WavesTab({ profile }: { readonly profile: ApiIdentity }) {
  return <UserPageWaves profile={profile} />;
}

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.WAVES];

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  metaLabel: TAB_CONFIG.metaLabel,
  Tab: WavesTab,
});

export default Page;
export { generateMetadata };
