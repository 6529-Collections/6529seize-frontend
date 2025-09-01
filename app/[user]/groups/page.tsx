import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageGroups from "@/components/user/groups/UserPageGroups";

const { Page, generateMetadata } = createUserTabPage({
  subroute: "groups",
  metaLabel: "Groups",
  Tab: UserPageGroups,
});

export default Page;
export { generateMetadata };
