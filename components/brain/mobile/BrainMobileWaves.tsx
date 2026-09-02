"use client";

import React, { useRef } from "react";
import Link from "next/link";
import {
  ChevronRightIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import BrainLeftSidebarWaves from "../left-sidebar/waves/BrainLeftSidebarWaves";
import { MemesWaveFooterView } from "../left-sidebar/waves/MemesWaveFooter";
import { useLayout } from "../my-stream/layout/LayoutContext";
import {
  MEMES_WAVE_DOCK_ONLY_SCROLL_CLEARANCE_CLASS_NAME,
  MEMES_WAVE_FLOATING_FOOTER_SCROLL_CLEARANCE_CLASS_NAME,
} from "../left-sidebar/waves/MemesWaveFooter.constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useMemesWaveFooterStats } from "@/hooks/useMemesWaveFooterStats";
import { t } from "@/i18n/messages";
import { SidebarIconTile } from "../left-sidebar/waves/SidebarIconTile";

interface BrainMobileWavesProps {
  readonly onOpenQuickVote: () => void;
  readonly onPrefetchQuickVote?: (() => void) | undefined;
}

const BrainMobileWaves: React.FC<BrainMobileWavesProps> = ({
  onOpenQuickVote,
  onPrefetchQuickVote,
}) => {
  const { mobileWavesViewStyle } = useLayout();
  const locale = useBrowserLocale();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Keep mobile scroll clearance and footer rendering on the same stats hook instance.
  const footerStats = useMemesWaveFooterStats();
  const scrollClearanceClassName = footerStats.isAvailable
    ? MEMES_WAVE_FLOATING_FOOTER_SCROLL_CLEARANCE_CLASS_NAME
    : MEMES_WAVE_DOCK_ONLY_SCROLL_CLEARANCE_CLASS_NAME;
  const scrollContainerClassName = `tw-min-h-0 tw-flex-1 tw-space-y-4 tw-overflow-y-auto tw-px-2 tw-pt-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300 sm:tw-px-4 md:tw-px-6 ${scrollClearanceClassName}`;

  return (
    <div
      className="tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-bg-[#0d0d0e]"
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
          className="tw-group tw-mx-4 tw-flex tw-box-border tw-items-center tw-gap-3 tw-rounded-xl tw-bg-iron-900/70 tw-px-4 tw-py-3 tw-text-iron-200 tw-no-underline tw-ring-1 tw-ring-inset tw-ring-white/[0.06] tw-transition-colors tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800/90 desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none"
        >
          <span className="tw-relative tw-size-8 tw-flex-shrink-0">
            <SidebarIconTile variant="selected">
              <Squares2X2Icon className="tw-size-4" aria-hidden="true" />
            </SidebarIconTile>
          </span>
          <span className="tw-min-w-0 tw-flex-1">
            <span className="tw-block tw-text-sm tw-font-normal">
              {t(locale, "waves.mobile.profileFeed.title")}
            </span>
            <span className="tw-mt-0.5 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
              {t(locale, "waves.mobile.profileFeed.subtitle")}
            </span>
          </span>
          <ChevronRightIcon
            className="tw-size-5 tw-flex-shrink-0 tw-text-iron-500 tw-transition-colors tw-duration-200 desktop-hover:group-hover:tw-text-iron-300 motion-reduce:tw-transition-none"
            aria-hidden="true"
          />
        </Link>
        <BrainLeftSidebarWaves scrollContainerRef={scrollContainerRef} />
      </div>
      <MemesWaveFooterView
        floating
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
        stats={footerStats}
      />
    </div>
  );
};

export default BrainMobileWaves;
