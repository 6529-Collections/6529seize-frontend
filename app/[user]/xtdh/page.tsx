import { Suspense } from "react";
import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";
import UserPageXtdh from "@/components/user/xtdh/UserPageXtdh";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.XTDH];

function UserPageXtdhTab({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  return (
    <Suspense fallback={null}>
      <UserPageXtdh profile={profile} />
    </Suspense>
  );
}

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  Tab: UserPageXtdhTab,
});

export default Page;
export { generateMetadata };
