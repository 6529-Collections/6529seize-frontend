import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageWaves from "@/components/user/waves/UserPageWaves";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

function WavesTab({ profile }: { readonly profile: ApiIdentity }) {
  return <UserPageWaves profile={profile} />;
}

const { Page, generateMetadata } = createUserTabPage({
  subroute: "waves",
  metaLabel: "Waves",
  Tab: WavesTab,
});

export default Page;
export { generateMetadata };
