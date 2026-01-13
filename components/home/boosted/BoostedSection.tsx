"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useBoostedDrops } from "@/hooks/useBoostedDrops";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import BoostedDropCardHome from "./BoostedDropCardHome";

const BOOSTED_DROPS_LIMIT = 10;

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
      <section className="tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0 tw-py-8 -tw-mx-8">
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
    <section className="tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0 tw-py-16 tw-mt-8 -tw-mx-8">
      <div className="tw-px-8">
        <div className="tw-mb-6 tw-flex tw-items-end tw-justify-between">
          <div>
            <span className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-50">
              Boosted Drops
            </span>
            <p className="tw-m-0 tw-mt-0.5 tw-text-sm tw-text-iron-400">
              Community-boosted right now
            </p>
          </div>
          <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-sm tw-font-medium tw-text-iron-400 tw-no-underline tw-transition-colors hover:tw-text-iron-50">
            <span>View all</span>
            <ArrowRightIcon className="tw-size-4 tw-flex-shrink-0" aria-hidden />
          </span>
        </div>

        {/* Horizontal scroll container */}
        <div className="-tw-mx-6 tw-flex tw-gap-5 tw-overflow-x-auto tw-scroll-smooth tw-px-6 tw-scrollbar-none md:-tw-mx-8 md:tw-px-8">
          {drops.map((drop) => (
            <BoostedDropCardHome
              key={drop.id}
              drop={drop}
              onClick={() => handleDropClick(drop)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
