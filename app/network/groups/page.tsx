import Groups from "@/components/groups/page/Groups";
import { getAppMetadata } from "@/components/providers/metadata";

export default function GroupsPage() {
  return (
    <main className="tw-min-h-[100dvh] tw-bg-black">
      <div className="tailwind-scope tw-min-h-screen tw-pt-2 lg:tw-pt-8 tw-pb-16 lg:tw-pb-20 tw-px-2 lg:tw-px-6 xl:tw-px-8 tw-mx-auto">
        <Groups />
      </div>
    </main>
  );
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "Groups",
    description: "Network",
  });
};
