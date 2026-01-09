"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useBoostedDrops } from "@/hooks/useBoostedDrops";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import BoostedDropCard from "./BoostedDropCard";

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
      <section className="tw-py-8">
        <div className="tw-flex tw-h-64 tw-items-center tw-justify-center">
          <div className="tw-text-sm tw-text-iron-500">Loading...</div>
        </div>
      </section>
    );
  }

  if (!drops || drops.length === 0) {
    return null;
  }

  return (
    <section className="tw-py-8">
      {/* Header */}
      <div className="tw-mb-4 tw-flex tw-items-center tw-justify-between">
        <div>
          <h2 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
            Boosted Drops
          </h2>
          <p className="tw-m-0 tw-mt-0.5 tw-text-sm tw-text-iron-400">
            Community-boosted right now
          </p>
        </div>
        <span className="tw-text-sm tw-text-iron-500">View all</span>
      </div>

      {/* Horizontal scroll container */}
      <div className="tw-flex tw-gap-4 tw-overflow-x-auto tw-scroll-smooth tw-pb-2 tw-scrollbar-none">
        {drops.map((drop) => (
          <BoostedDropCard
            key={drop.id}
            drop={drop}
            onClick={() => handleDropClick(drop)}
          />
        ))}
      </div>
    </section>
  );
}
