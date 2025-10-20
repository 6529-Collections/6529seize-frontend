import { getAppMetadata } from "@/components/providers/metadata";
import Waves from "@/components/waves/Waves";
import type { Metadata } from "next";

export default function DiscoverPage() {
  return (
    <div className="tailwind-scope lg:tw-min-h-screen tw-bg-black tw-overflow-x-hidden">
      <div className="tw-overflow-hidden tw-h-full tw-w-full">
        <Waves heading="Discover" documentTitle="Discover | Brain" />
      </div>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Discover", description: "Brain" });
}
