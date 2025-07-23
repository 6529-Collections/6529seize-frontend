import Waves from "@/components/waves/Waves";
import { useSetTitle } from "@/contexts/TitleContext";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function WavesPage() {
  useSetTitle("Waves | Brain");

  return (
    <div className="tailwind-scope lg:tw-min-h-screen tw-bg-iron-950 tw-overflow-x-hidden">
      <div className="tw-overflow-hidden tw-h-full tw-w-full">
        <Waves />
      </div>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Waves", description: "Brain" });
}
