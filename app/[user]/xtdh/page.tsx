import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageXTDH from "@/components/user/xtdh/UserPageXTDH";

function XTDHTab({ profile }: { readonly profile: ApiIdentity }) {
  return (
    <div className="tailwind-scope">
      <UserPageXTDH profile={profile} />
    </div>
  );
}

const { Page, generateMetadata } = createUserTabPage({
  subroute: "xtdh",
  metaLabel: "xTDH",
  Tab: XTDHTab,
});

export default Page;
export { generateMetadata };

