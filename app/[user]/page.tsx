import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageBrainWrapper from "@/components/user/brain/UserPageBrainWrapper";

const { Page, generateMetadata } = createUserTabPage({
  subroute: "",
  metaLabel: "Brain",
  Tab: ({ profile }) => (
    <div className="tailwind-scope">
      <UserPageBrainWrapper profile={profile} />
    </div>
  ),
});

export default Page;
export { generateMetadata };
