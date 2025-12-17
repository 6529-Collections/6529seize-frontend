import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageProxy from "@/components/user/proxy/UserPageProxy";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";

function ProxyTab({ profile }: { readonly profile: ApiIdentity }) {
  return <UserPageProxy profile={profile} />;
}

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.PROXY];

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  metaLabel: TAB_CONFIG.metaLabel,
  Tab: ProxyTab,
});

export default Page;
export { generateMetadata };
