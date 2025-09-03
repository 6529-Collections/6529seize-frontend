import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageSubscriptions from "@/components/user/subscriptions/UserPageSubscriptions";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

function SubscriptionsTab({ profile }: { readonly profile: ApiIdentity }) {
  return <UserPageSubscriptions profile={profile} />;
}

const { Page, generateMetadata } = createUserTabPage({
  subroute: "subscriptions",
  metaLabel: "Subscriptions",
  Tab: SubscriptionsTab,
});

export default Page;
export { generateMetadata };
