import Groups from "@/components/groups/page/Groups";
import {
  NETWORK_PAGE_HORIZONTAL_GUTTERS,
  NETWORK_PAGE_SURFACE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import { getAppMetadata } from "@/components/providers/metadata";

export default function GroupsPage() {
  return (
    <main className={NETWORK_PAGE_SURFACE_CLASSES}>
      <div
        className={`${NETWORK_PAGE_HORIZONTAL_GUTTERS} tw-mx-auto tw-min-h-screen tw-pb-16 tw-pt-6 lg:tw-pb-20 lg:tw-pt-8`}
      >
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
