"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useBoostedDrops } from "@/hooks/useBoostedDrops";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import BoostedDropCardHome from "./BoostedDropCardHome";

const BOOSTED_DROPS_LIMIT = 50;

export function BoostedSection() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { data: drops, isLoading } = useBoostedDrops({
    limit: BOOSTED_DROPS_LIMIT,
  });

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const epsilon = 1;
    setCanScrollLeft(container.scrollLeft > epsilon);
    setCanScrollRight(container.scrollLeft < maxScrollLeft - epsilon);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    updateScrollState();
    const handleScroll = () => updateScrollState();
    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, drops?.length]);

  const handleDropClick = useCallback(
    (drop: ApiDrop) => {
      router.push(`/waves?wave=${drop.wave.id}&serialNo=${drop.serial_no}`);
    },
    [router]
  );

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 260;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

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
        <div className="tw-mb-8 tw-flex tw-flex-col tw-items-start tw-gap-4 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
          <div>
            <span className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white md:tw-text-2xl">
              Boosted Drops
            </span>
            <p className="tw-mb-0 tw-mt-2 tw-text-base tw-text-iron-500">
              Community-boosted right now
            </p>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="tw-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-iron-900 tw-text-iron-500 tw-shadow-lg tw-ring-1 tw-ring-iron-50/5 tw-transition-all hover:tw-scale-105 hover:tw-bg-iron-800 hover:tw-text-iron-50 active:tw-scale-95 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 disabled:hover:tw-scale-100 disabled:hover:tw-bg-iron-900 disabled:hover:tw-text-iron-500"
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="tw-size-4 tw-flex-shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="tw-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-iron-900 tw-text-iron-500 tw-shadow-lg tw-ring-1 tw-ring-iron-50/5 tw-transition-all hover:tw-scale-105 hover:tw-bg-iron-800 hover:tw-text-iron-50 active:tw-scale-95 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 disabled:hover:tw-scale-100 disabled:hover:tw-bg-iron-900 disabled:hover:tw-text-iron-500"
              aria-label="Scroll right"
            >
              <ChevronRightIcon className="tw-size-4" />
            </button>
          </div>
        </div>

        {/* Horizontal scroll container */}
        <div
          ref={scrollRef}
          className="-tw-mx-6 tw-flex tw-gap-5 tw-overflow-x-auto tw-scroll-smooth tw-px-6 tw-pb-8 tw-pt-4 tw-scrollbar-none md:-tw-mx-8 md:tw-px-8"
        >
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
