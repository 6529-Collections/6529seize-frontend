"use client";

import LatestActivity from "@/components/latest-activity/LatestActivity";
import { useSetTitle } from "@/contexts/TitleContext";

export default function NFTActivityPage() {
  useSetTitle("NFT Activity | Network");

  return (
    <main className="tailwind-scope tw-min-h-[calc(100vh-100px)] tw-border tw-border-y-0 tw-border-l-0 tw-border-solid tw-border-iron-800 tw-bg-[#0D0D0F] tw-pb-5 tw-text-white">
      <section className="tw-px-4 tw-py-4 md:tw-px-6 md:tw-pb-10 lg:tw-px-8">
        <LatestActivity page={1} pageSize={50} showMore />
      </section>
    </main>
  );
}
