import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageStats from "@/components/user/stats/UserPageStats";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

function StatsTab({ profile }: { readonly profile: ApiIdentity }) {
  return <UserPageStats profile={profile} />;
}

const { Page, generateMetadata } = createUserTabPage({
  subroute: "stats",
  metaLabel: "Stats",
  Tab: StatsTab,
});

export default Page;
export { generateMetadata };
