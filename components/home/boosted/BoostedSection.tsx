"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import BoostIcon from "@/components/common/icons/BoostIcon";
import { useBoostedDrops } from "@/hooks/useBoostedDrops";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import BoostedDropCardHome from "./BoostedDropCardHome";

const BOOSTED_DROPS_LIMIT = 50;
const MAX_ROWS = 3;

export function BoostedSection() {
  const router = useRouter();
  const { data: drops, isLoading } = useBoostedDrops({
    limit: BOOSTED_DROPS_LIMIT,
  });

  // Detect breakpoints to determine column count (matches Tailwind lg breakpoint)
  const isLg = useMediaQuery("(min-width: 1024px)");
  const isSm = useMediaQuery("(min-width: 640px)");

  // Calculate max items based on columns * MAX_ROWS (mobile: 1x6)
  const visibleDrops = useMemo(() => {
    if (!drops) return [];
    if (!isSm) return drops.slice(0, 6); // Mobile: 1 col × 6 items
    const columns = isLg ? 3 : 2;
    const maxItems = columns * MAX_ROWS;
    return drops.slice(0, maxItems);
  }, [drops, isLg, isSm]);

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

  if (!drops || visibleDrops.length === 0) {
    return null;
  }

  return (
    <section className="tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-px-4 tw-py-10 md:tw-px-6 md:tw-py-16 lg:tw-px-8">
      <div className="tw-mb-8">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-relative tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-full tw-bg-gradient-to-br tw-from-orange-400/15 tw-via-orange-500/5 tw-to-orange-600/15 tw-p-1 tw-shadow-[0_10px_20px_-14px_rgba(251,146,60,0.6)] tw-ring-1 tw-ring-inset tw-ring-orange-400/20">
            <div className="tw-absolute tw-inset-1.5 tw-rounded-full tw-border tw-border-white/5" />
            <BoostIcon className="tw-relative tw-size-6 tw-text-orange-400 tw-drop-shadow-[0_4px_10px_rgba(251,146,60,0.35)]" />
          </div>
          <span className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white md:tw-text-2xl">
            Boosted Drops
          </span>
        </div>
        <p className="tw-mb-0 tw-mt-2 tw-text-base tw-text-iron-500">
          Community-boosted right now
        </p>
      </div>

      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-y-4 tw-gap-x-2 lg:tw-grid-cols-3 md:tw-gap-x-3 lg:tw-gap-5">
        {visibleDrops.map((drop) => (
          <div key={drop.id}>
            <BoostedDropCardHome
              drop={drop}
              onClick={() => handleDropClick(drop)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
