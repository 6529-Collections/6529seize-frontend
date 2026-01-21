"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useBoostedDrops } from "@/hooks/useBoostedDrops";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import Masonry from "react-masonry-css";
import BoostedDropCardHome from "./BoostedDropCardHome";

const BOOSTED_DROPS_LIMIT = 50;

const MASONRY_BREAKPOINTS = {
  default: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 2,
};

export function BoostedSection() {
  const router = useRouter();
  const { data: drops, isLoading } = useBoostedDrops({
    limit: BOOSTED_DROPS_LIMIT,
  });

  const handleDropClick = useCallback(
    (drop: ApiDrop) => {
      router.push(`/waves?wave=${drop.wave.id}&serialNo=${drop.serial_no}`);
    },
    [router]
  );

  if (isLoading) {
    return (
      <section className="-tw-mx-8 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-px-4 tw-py-16 md:tw-px-6 lg:tw-px-8">
        <div className="tw-px-8">
          <div className="tw-flex tw-h-64 tw-items-center tw-justify-center">
            <div className="tw-text-sm tw-text-iron-500">Loading...</div>
          </div>
        </div>
      </section>
    );
  }

  if (!drops || drops.length === 0) {
    return null;
  }

  return (
    <section className="-tw-mx-8 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-px-4 tw-py-10 md:tw-py-16 md:tw-px-6 lg:tw-px-8">
      <div className="tw-px-8">
        <div className="tw-mb-8">
          <span className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white md:tw-text-2xl">
            Boosted Drops
          </span>
          <p className="tw-mb-0 tw-mt-2 tw-text-base tw-text-iron-500">
            Community-boosted right now
          </p>
        </div>

        <Masonry
          breakpointCols={MASONRY_BREAKPOINTS}
          className="tw-flex tw--ml-5 tw-w-auto"
          columnClassName="tw-pl-5 tw-bg-clip-padding"
        >
          {drops.map((drop) => (
            <div key={drop.id} className="tw-mb-5">
              <BoostedDropCardHome
                drop={drop}
                onClick={() => handleDropClick(drop)}
              />
            </div>
          ))}
        </Masonry>
      </div>
    </section>
  );
}
