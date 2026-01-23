"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
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
      <section className="-tw-mx-8 tw-relative tw-bg-iron-950 tw-px-4 tw-py-16 md:tw-px-6 lg:tw-px-8">
        <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-h-px tw-bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_15%,rgba(255,255,255,0.08)_85%,transparent_100%)]" />
        <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-px tw-bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_15%,rgba(255,255,255,0.08)_85%,transparent_100%)]" />
        <div className="tw-relative tw-px-8">
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
    <section className="tw-relative tw-bg-iron-950 tw-px-4 tw-py-10 md:tw-px-6 md:tw-py-16 lg:tw-px-8">
      <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-h-px tw-bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_15%,rgba(255,255,255,0.08)_85%,transparent_100%)]" />
      <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-px tw-bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_15%,rgba(255,255,255,0.08)_85%,transparent_100%)]" />
      <div className="tw-relative">
        <div className="tw-mb-8">
          <div className="tw-flex tw-items-center">
            <span className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-200 md:tw-text-2xl">
              Boosted Drops
            </span>
          </div>
          <p className="tw-mb-0 tw-mt-2 tw-text-base tw-text-iron-500">
            Community-boosted right now
          </p>
        </div>

        <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-gap-6">
          {visibleDrops.map((drop) => (
            <div key={drop.id}>
              <BoostedDropCardHome
                drop={drop}
                onClick={() => handleDropClick(drop)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
