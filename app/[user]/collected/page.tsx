import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageCollected from "@/components/user/collected/UserPageCollected";

const { Page, generateMetadata } = createUserTabPage({
  subroute: "collected",
  metaLabel: "Collected",
  Tab: UserPageCollected,
});

export default Page;
export { generateMetadata };
