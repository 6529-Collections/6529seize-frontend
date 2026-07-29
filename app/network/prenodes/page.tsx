import PrenodesStatus from "@/components/prenodes/PrenodesStatus";
import { NETWORK_REFERENCE_PAGE_CLASSES } from "@/components/network/networkPageLayoutClasses";
import { getAppMetadata } from "@/components/providers/metadata";

export default function PrenodesPage() {
  return (
    <main
      className={`${NETWORK_REFERENCE_PAGE_CLASSES} tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-900 tw-bg-[#0D0D0F] tw-text-iron-100`}
    >
      <PrenodesStatus />
    </main>
  );
}

export const generateMetadata = () => {
  return getAppMetadata({
    title: "Prenodes | Network",
    description: "Network",
  });
};
