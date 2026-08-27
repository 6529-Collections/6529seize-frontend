"use client";

import { LockClosedIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { ImageScale } from "@/helpers/image.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { ProfileWaveActivitySidebarItem } from "@/types/profile-wave-activity.types";
import Link from "next/link";
import Image from "next/image";
import WavesIcon from "@/components/common/icons/WavesIcon";
import { getUserPageBrainSidebarMessage } from "./userPageBrainSidebar.messages";
import {
  formatSidebarWaveActivityTime,
  getSidebarWaveHref,
  getSidebarWaveImageSrc,
} from "./userPageBrainSidebarWave.helpers";

export default function UserPageBrainSidebarWaveItem({
  wave,
  showTotalPosts,
}: {
  readonly wave: ProfileWaveActivitySidebarItem;
  readonly showTotalPosts: boolean;
}) {
  const locale = useBrowserLocale();
  const href = getSidebarWaveHref(wave);
  const imageSrc = getSidebarWaveImageSrc(wave, ImageScale.W_200_H_200);
  const formattedPostCount = formatInteger(locale, wave.totalDropsCount);
  const hasLatestPost =
    wave.latestPostTimestamp !== null && wave.latestPostTimestamp > 0;
  const totalPostsLabel = getUserPageBrainSidebarMessage(
    locale,
    wave.totalDropsCount === 1
      ? "user.brain.sidebar.totalWavePosts.one"
      : "user.brain.sidebar.totalWavePosts.other",
    { count: formattedPostCount }
  );
  const lastPostLabel = hasLatestPost
    ? getUserPageBrainSidebarMessage(locale, "user.brain.sidebar.lastPost", {
        time: formatSidebarWaveActivityTime(locale, wave.latestPostTimestamp),
      })
    : getUserPageBrainSidebarMessage(
        locale,
        "user.brain.sidebar.noPostsByProfile"
      );

  return (
    <Link
      href={href}
      prefetch={false}
      className="tw-group tw-flex tw-cursor-pointer tw-items-center tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/80 tw-p-3 tw-no-underline tw-shadow-2xl tw-transition-all focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/15 motion-reduce:tw-transition-none"
    >
      <div className="tw-relative tw-h-10 tw-w-10 tw-shrink-0 tw-overflow-hidden tw-rounded-full tw-border tw-border-solid tw-border-white/[0.04] tw-bg-iron-900 tw-shadow-sm tw-transition-colors desktop-hover:group-hover:tw-border-white/[0.1]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="40px"
            className="tw-object-cover"
          />
        ) : (
          <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-iron-900">
            <WavesIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-300" />
          </div>
        )}
      </div>

      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-justify-center">
        <div className="tw-mb-1 tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5">
            {wave.isPrivate && (
              <>
                <LockClosedIcon
                  aria-hidden="true"
                  className="tw-h-3 tw-w-3 tw-shrink-0 tw-text-white/30"
                />
                <span className="tw-sr-only">
                  {getUserPageBrainSidebarMessage(
                    locale,
                    "user.brain.sidebar.privateWave"
                  )}
                </span>
              </>
            )}
            <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors desktop-hover:group-hover:tw-text-iron-50">
              {wave.name}
            </span>
          </div>
        </div>

        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-iron-500">
          {hasLatestPost ? (
            <time
              dateTime={new Date(wave.latestPostTimestamp).toISOString()}
              className="tw-truncate"
            >
              {lastPostLabel}
            </time>
          ) : (
            <span className="tw-truncate">{lastPostLabel}</span>
          )}
          {showTotalPosts && (
            <>
              <span
                aria-hidden="true"
                className="tw-h-0.5 tw-w-0.5 tw-shrink-0 tw-rounded-full tw-bg-white/30"
              />
              <span className="tw-shrink-0">{totalPostsLabel}</span>
            </>
          )}
        </div>
      </div>

      <ChevronRightIcon className="tw-h-4 tw-w-4 tw-shrink-0 -tw-translate-x-1 tw-text-iron-600 tw-opacity-0 tw-transition-all tw-duration-300 desktop-hover:group-hover:tw-translate-x-0 desktop-hover:group-hover:tw-text-iron-400 desktop-hover:group-hover:tw-opacity-100" />
    </Link>
  );
}
