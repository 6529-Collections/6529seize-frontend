import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageMentionShortcuts from "@/components/user/mention-shortcuts/UserPageMentionShortcuts";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";

function MentionShortcutsTab({ profile }: { readonly profile: ApiIdentity }) {
  return <UserPageMentionShortcuts profile={profile} />;
}

const TAB_CONFIG =
  USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS["MENTION-SHORTCUTS"]];

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  Tab: MentionShortcutsTab,
});

export default Page;
export { generateMetadata };
