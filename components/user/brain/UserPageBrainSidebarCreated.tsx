"use client";

import { useState, type ReactNode } from "react";
import { FallbackImage } from "@/components/common/FallbackImage";
import { LockClosedIcon, StarIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  getRandomColorWithSeed,
  getTimeAgoShort,
  numberWithCommas,
} from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { useWaves } from "@/hooks/useWaves";

const getProfileWaveIdentity = (profile: ApiIdentity): string =>
  profile.handle ?? profile.query ?? profile.primary_wallet;

type CreatedWaveDisplay = {
  readonly wave: ApiWave;
  readonly href: string;
  readonly isPrivate: boolean;
  readonly dropsCount: string;
  readonly lastDropTimestamp: ApiWave["metrics"]["latest_drop_timestamp"];
  readonly image: {
    readonly primarySrc: string;
    readonly fallbackSrc: string;
  } | null;
  readonly imageAreaStyle:
    | {
        readonly background: string;
      }
    | undefined;
};

const getCreatedWaveDisplay = (wave: ApiWave): CreatedWaveDisplay => ({
  wave,
  href: getWaveRoute({
    waveId: wave.id,
    isDirectMessage: wave.chat.scope.group?.is_direct_message ?? false,
    isApp: false,
  }),
  isPrivate:
    Boolean(wave.visibility.scope.group) &&
    !(wave.chat.scope.group?.is_direct_message ?? false),
  dropsCount: numberWithCommas(wave.metrics.drops_count),
  lastDropTimestamp: wave.metrics.latest_drop_timestamp,
  image: wave.picture
    ? {
        primarySrc: getScaledImageUri(wave.picture, ImageScale.W_AUTO_H_50),
        fallbackSrc: wave.picture,
      }
    : null,
  imageAreaStyle: wave.picture
    ? undefined
    : {
        background: `linear-gradient(135deg, ${
          wave.author.banner1_color ??
          getRandomColorWithSeed(wave.author.handle ?? wave.id)
        } 0%, ${
          wave.author.banner2_color ?? getRandomColorWithSeed(`${wave.id}-alt`)
        } 100%)`,
      },
});

const LoadingState = () => (
  <div className="tw-space-y-2.5" aria-label="Loading created waves">
    {[0, 1, 2].map((key) => (
      <div
        key={key}
        className="tw-flex tw-items-center tw-gap-3 tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.05] tw-bg-white/[0.02] tw-p-3 tw-shadow-inner"
      >
        <div className="tw-h-10 tw-w-10 tw-shrink-0 tw-animate-pulse tw-rounded-xl tw-bg-white/[0.06]" />
        <div className="tw-min-w-0 tw-flex-1 tw-space-y-1.5">
          <div className="tw-h-3 tw-w-2/3 tw-animate-pulse tw-rounded tw-bg-white/[0.06]" />
          <div className="tw-h-2.5 tw-w-1/2 tw-animate-pulse tw-rounded tw-bg-white/[0.05]" />
        </div>
      </div>
    ))}
  </div>
);

export default function UserPageBrainSidebarCreated({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const [expandedIdentity, setExpandedIdentity] = useState<string | null>(null);
  const identity = getProfileWaveIdentity(profile);
  const hasIdentity = identity.length > 0;
  const { waves, status, error } = useWaves({
    identity,
    waveName: null,
    enabled: hasIdentity,
    directMessage: false,
    limit: 20,
  });
  const showAllWaves = expandedIdentity === identity;
  const visibleWaves = showAllWaves ? waves : waves.slice(0, 1);
  const visibleWaveItems = visibleWaves.map(getCreatedWaveDisplay);
  const remainingWavesCount = Math.max(waves.length - 1, 0);
  const showMoreLabel =
    remainingWavesCount === 1
      ? "Show 1 more"
      : `Show ${remainingWavesCount} more`;
  const shouldShowLoading = hasIdentity && status === "pending";
  const shouldShowWaves = !error && waves.length > 0;
  const shouldRenderSection = shouldShowLoading || shouldShowWaves;
  let section: ReactNode = null;

  if (shouldRenderSection) {
    let sectionContent: ReactNode = null;

    if (shouldShowLoading) {
      sectionContent = <LoadingState />;
    } else if (shouldShowWaves) {
      sectionContent = (
        <>
          {visibleWaveItems.map(
            ({
              wave,
              href,
              isPrivate,
              dropsCount,
              lastDropTimestamp,
              image,
              imageAreaStyle,
            }) => (
              <Link
                key={wave.id}
                href={href}
                prefetch={false}
                className="tw-group tw-flex tw-cursor-pointer tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-3 tw-no-underline tw-shadow-inner tw-transition-all desktop-hover:hover:tw-border-white/[0.1] desktop-hover:hover:tw-bg-white/[0.04]"
              >
                <div className="tw-relative tw-h-10 tw-w-10 tw-shrink-0 tw-overflow-hidden tw-rounded-full tw-border tw-border-solid tw-border-white/10">
                  <div className="tw-absolute tw-inset-0 tw-z-10 tw-bg-black/20 tw-transition-colors desktop-hover:group-hover:tw-bg-transparent" />
                  {image ? (
                    <FallbackImage
                      primarySrc={image.primarySrc}
                      fallbackSrc={image.fallbackSrc}
                      alt={wave.name}
                      fill
                      sizes="40px"
                      className="tw-object-cover"
                    />
                  ) : (
                    <div
                      className="tw-h-full tw-w-full"
                      style={imageAreaStyle}
                    />
                  )}
                </div>

                <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-justify-center">
                  <div className="tw-mb-0.5 tw-flex tw-items-center tw-justify-between">
                    <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5">
                      {wave.pinned && (
                        <StarIcon className="tw-h-3 tw-w-3 tw-shrink-0 tw-text-white/30 tw-transition-colors desktop-hover:group-hover:tw-text-white/60" />
                      )}
                      {isPrivate && (
                        <LockClosedIcon className="tw-h-3 tw-w-3 tw-shrink-0 tw-text-white/30" />
                      )}
                      <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-white/80 tw-transition-colors desktop-hover:group-hover:tw-text-white">
                        {wave.name}
                      </span>
                    </div>
                  </div>

                  <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-white/60">
                    {lastDropTimestamp ? (
                      <>
                        <span>{getTimeAgoShort(lastDropTimestamp)}</span>
                        <span className="tw-h-1 tw-w-1 tw-rounded-full tw-bg-white/25" />
                        <span>{dropsCount} drops</span>
                      </>
                    ) : (
                      <span>No drops yet</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          )}
          {waves.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setExpandedIdentity((current) =>
                  current === identity ? null : identity
                )
              }
              className="tw-mt-2 tw-cursor-pointer tw-border-none tw-bg-black tw-px-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-white/30 tw-transition-colors desktop-hover:hover:tw-text-white/60"
            >
              {showAllWaves ? "Show less" : showMoreLabel}
            </button>
          )}
        </>
      );
    }

    section = (
      <section aria-labelledby="brain-created-waves-heading">
        <span
          id="brain-created-waves-heading"
          className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500"
        >
          Created Waves
        </span>
        <div className="tw-mt-3 tw-space-y-2.5">{sectionContent}</div>
      </section>
    );
  }

  return section;
}
