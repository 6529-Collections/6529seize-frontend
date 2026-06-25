"use client";

import React, { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Squares2X2Icon } from "@heroicons/react/24/outline";
import BrainLeftSidebarWaves from "../left-sidebar/waves/BrainLeftSidebarWaves";
import MemesWaveFooter from "../left-sidebar/waves/MemesWaveFooter";
import { useLayout } from "../my-stream/layout/LayoutContext";
import {
  MEMES_WAVE_DOCK_ONLY_SCROLL_CLEARANCE_CLASS_NAME,
  MEMES_WAVE_FLOATING_FOOTER_SCROLL_CLEARANCE_CLASS_NAME,
} from "../left-sidebar/waves/MemesWaveFooter.constants";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

interface BrainMobileWavesProps {
  readonly onOpenQuickVote: () => void;
  readonly onPrefetchQuickVote?: (() => void) | undefined;
}

const BrainMobileWaves: React.FC<BrainMobileWavesProps> = ({
  onOpenQuickVote,
  onPrefetchQuickVote,
}) => {
  const { mobileWavesViewStyle } = useLayout();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasFloatingFooter, setHasFloatingFooter] = useState(false);
  const scrollClearanceClassName = hasFloatingFooter
    ? MEMES_WAVE_FLOATING_FOOTER_SCROLL_CLEARANCE_CLASS_NAME
    : MEMES_WAVE_DOCK_ONLY_SCROLL_CLEARANCE_CLASS_NAME;
  const scrollContainerClassName = `tw-min-h-0 tw-flex-1 tw-space-y-4 tw-overflow-y-auto tw-px-2 tw-pt-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300 sm:tw-px-4 md:tw-px-6 ${scrollClearanceClassName}`;
  const handleFooterAvailabilityChange = useCallback((isAvailable: boolean) => {
    setHasFloatingFooter(isAvailable);
  }, []);

  return (
    <div
      className="tw-flex tw-h-full tw-min-h-0 tw-flex-col"
      style={mobileWavesViewStyle}
    >
      <div
        data-mobile-bottom-nav-scroll-target="true"
        className={scrollContainerClassName}
        ref={scrollContainerRef}
      >
        <Link
          href="/waves?view=profile-feed"
          prefetch={false}
          className="tw-group tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-py-3 tw-text-iron-200 tw-no-underline tw-ring-1 tw-ring-inset tw-ring-white/5 tw-transition desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white"
        >
          <span className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-900 tw-text-primary-300 tw-ring-1 tw-ring-inset tw-ring-iron-700 desktop-hover:group-hover:tw-bg-iron-800">
            <Squares2X2Icon className="tw-size-5" aria-hidden="true" />
          </span>
          <span className="tw-min-w-0">
            <span className="tw-block tw-text-sm tw-font-semibold">
              {t(DEFAULT_LOCALE, "waves.mobile.profileFeed.title")}
            </span>
            <span className="tw-mt-0.5 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
              {t(DEFAULT_LOCALE, "waves.mobile.profileFeed.subtitle")}
            </span>
          </span>
        </Link>
        <BrainLeftSidebarWaves scrollContainerRef={scrollContainerRef} />
      </div>
      <MemesWaveFooter
        floating
        onAvailabilityChange={handleFooterAvailabilityChange}
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    </div>
  );
};

export default BrainMobileWaves;
