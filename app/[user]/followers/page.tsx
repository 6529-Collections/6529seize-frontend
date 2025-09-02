import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageFollowers from "@/components/user/followers/UserPageFollowers";

const { Page, generateMetadata } = createUserTabPage({
  subroute: "followers",
  metaLabel: "Followers",
  Tab: UserPageFollowers,
});

export default Page;
export { generateMetadata };
