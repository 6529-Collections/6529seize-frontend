import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageProfileWave from "@/components/user/waves/UserPageProfileWave";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";
import { redirect } from "next/navigation";

const getProfileTabDestination = ({
  profile,
  query,
}: {
  readonly profile: ApiIdentity;
  readonly query: Record<string, string | string[] | undefined>;
}): string => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (key === "curation" || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        searchParams.append(key, entry);
      }
      continue;
    }

    searchParams.append(key, value);
  }

  const canonicalUser = profile.handle ?? profile.primary_wallet ?? "";
  const basePath = canonicalUser ? `/${encodeURIComponent(canonicalUser)}` : "/";
  const queryString = searchParams.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
};

function WaveTab({ profile }: { readonly profile: ApiIdentity }) {
  return <UserPageProfileWave profile={profile} />;
}

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.WAVES];

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  metaLabel: TAB_CONFIG.metaLabel,
  Tab: WaveTab,
  getTabProps: async ({ profile, query }) => {
    if (!profile.profile_wave_id) {
      redirect(getProfileTabDestination({ profile, query }));
    }

    return {};
  },
});

export default Page;
export { generateMetadata };
