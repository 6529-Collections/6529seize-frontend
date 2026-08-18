import Groups from "@/components/groups/page/Groups";
import { getAppMetadata } from "@/components/providers/metadata";

export default function GroupsPage() {
  return (
    <main className="tailwind-scope tw-min-h-[100dvh] tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-900 tw-bg-black">
      <div className="tailwind-scope tw-mx-auto tw-min-h-screen tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pb-20 lg:tw-pt-8 xl:tw-px-8">
        <Groups />
      </div>
    </main>
  );
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "Groups | Network",
    description: "Network",
  });
};
