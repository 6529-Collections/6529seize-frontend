import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageSubscriptions from "@/components/user/subscriptions/UserPageSubscriptions";
import { SubscriptionPageGate } from "@/components/common/NftPurchasingGate";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";

function SubscriptionsTab({ profile }: { readonly profile: ApiIdentity }) {
  // UserPageTabs already redirects a hidden tab to this profile's Identity.
  // The tab mounts after hydration; a viewport-tall blank space keeps the
  // footer out of view until then.
  return (
    <SubscriptionPageGate
      placeholder={
        <div aria-hidden="true" className="tw-min-h-[calc(100dvh-100px)]" />
      }
    >
      <UserPageSubscriptions profile={profile} />
    </SubscriptionPageGate>
  );
}

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.SUBSCRIPTIONS];

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  Tab: SubscriptionsTab,
});

export default Page;
export { generateMetadata };
