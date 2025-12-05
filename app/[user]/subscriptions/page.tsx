import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageSubscriptions from "@/components/user/subscriptions/UserPageSubscriptions";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";

function SubscriptionsTab({ profile }: { readonly profile: ApiIdentity }) {
  return <UserPageSubscriptions profile={profile} />;
}

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.SUBSCRIPTIONS];

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  metaLabel: TAB_CONFIG.metaLabel,
  Tab: SubscriptionsTab,
});

export default Page;
export { generateMetadata };
