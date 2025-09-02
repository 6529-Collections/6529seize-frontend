import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageProxy from "@/components/user/proxy/UserPageProxy";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

function ProxyTab({ profile }: { readonly profile: ApiIdentity }) {
  return <UserPageProxy profile={profile} />;
}

const { Page, generateMetadata } = createUserTabPage({
  subroute: "proxy",
  metaLabel: "Proxy",
  Tab: ProxyTab,
});

export default Page;
export { generateMetadata };
