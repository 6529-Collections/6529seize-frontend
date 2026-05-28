"use client";

import type React from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWater } from "@fortawesome/free-solid-svg-icons";
import { FallbackImage } from "@/components/common/FallbackImage";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveDescriptionPreviewText } from "@/helpers/waves/waveDescriptionPreview";
import { useProfileWave } from "@/hooks/useProfileWave";
import { useWaveById } from "@/hooks/useWaveById";
import { useWaveCurationDrops } from "@/hooks/useWaveCurationDrops";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import { CurationPreviewShell } from "./curation-preview/CurationPreviewShell";
import { PreviewTile } from "./curation-preview/CurationPreviewTiles";
import { getPreviewItems } from "./curation-preview/dropClassification";
import type {
  CurationWavePreviewCardProps,
  CurationWavePreviewCardVariant,
} from "./curation-preview/types";
import {
  getTrimmedText,
  getWaveAuthor,
  getWaveHref,
  PREVIEW_DROPS_FETCH_LIMIT,
} from "./curation-preview/utils";

const getBannerBackground = ({
  banner1,
  banner2,
}: {
  readonly banner1?: string | null | undefined;
  readonly banner2?: string | null | undefined;
}): string | null => {
  const firstColor = getTrimmedText(banner1);
  const secondColor = getTrimmedText(banner2);

  if (firstColor && secondColor) {
    return `linear-gradient(60deg, ${firstColor} 0%, ${secondColor} 100%)`;
  }

  return null;
};

const WavePreviewPicture: React.FC<{
  readonly picture: string | null | undefined;
  readonly sizeClassName: string;
  readonly iconClassName: string;
  readonly imageSize: string;
}> = ({ picture, sizeClassName, iconClassName, imageSize }) => (
  <div
    className={`${sizeClassName} tw-relative tw-flex-shrink-0 tw-overflow-hidden tw-rounded-full tw-bg-[#1A1A20] tw-shadow-sm tw-ring-1 tw-ring-white/[0.05]`}
  >
    {picture ? (
      <FallbackImage
        primarySrc={getScaledImageUri(picture, ImageScale.W_200_H_200)}
        fallbackSrc={picture}
        alt=""
        fill
        sizes={imageSize}
        className="tw-object-cover"
      />
    ) : (
      <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center">
        <FontAwesomeIcon
          icon={faWater}
          className={`${iconClassName} tw-text-white/30`}
          aria-hidden="true"
        />
      </div>
    )}
  </div>
);

const CurationPreviewBody: React.FC<{
  readonly hasBannerCover: boolean;
  readonly variant: CurationWavePreviewCardVariant;
  readonly children: React.ReactNode;
}> = ({ hasBannerCover, variant, children }) => {
  if (hasBannerCover) {
    return (
      <div className="tw-relative tw-z-10 -tw-mt-3 tw-px-5 tw-pb-4">
        {children}
      </div>
    );
  }

  if (variant === "sheet") {
    return <div className="tw-px-4 tw-pb-4 tw-pt-6">{children}</div>;
  }

  return <div className="tw-px-4 tw-pb-4 tw-pt-4">{children}</div>;
};

export const CurationWavePreviewCard: React.FC<
  CurationWavePreviewCardProps
> = ({
  waveId,
  profileIdentity,
  fallbackName,
  fallbackPfp,
  variant = "hovercard",
}) => {
  const normalizedProfileIdentity = getTrimmedText(profileIdentity);
  const { wave } = useWaveById(waveId);
  const {
    data: profileWave,
    isError: isProfileWaveError,
    isFetching: isProfileWaveFetching,
  } = useProfileWave({
    identity: normalizedProfileIdentity,
    enabled: normalizedProfileIdentity !== null,
  });
  const hasResolvedProfileWave =
    normalizedProfileIdentity === null ||
    profileWave !== undefined ||
    isProfileWaveError;
  const selectedProfileCurationId =
    profileWave?.profile_wave_id === waveId
      ? getTrimmedText(profileWave.profile_curation_id)
      : null;
  const shouldLoadFallbackCurations =
    hasResolvedProfileWave && selectedProfileCurationId === null;
  const { data: curations = [], isFetching: areCurationsFetching } =
    useWaveCurations({
      waveId,
      enabled: shouldLoadFallbackCurations,
    });
  const fallbackCurationId = shouldLoadFallbackCurations
    ? (curations.at(0)?.id ?? null)
    : null;
  const curationId = selectedProfileCurationId ?? fallbackCurationId;
  const { drops, isFetching: areDropsFetching } = useWaveCurationDrops({
    wave: wave ?? null,
    curationId,
    pageSize: PREVIEW_DROPS_FETCH_LIMIT,
    enabled: hasResolvedProfileWave && curationId !== null,
  });

  const isFetching =
    isProfileWaveFetching || areCurationsFetching || areDropsFetching;
  const firstDropWave = drops.at(0)?.wave;
  const waveName =
    getTrimmedText(wave?.name) ??
    getTrimmedText(fallbackName) ??
    getTrimmedText(firstDropWave?.name) ??
    "Featured wave";
  const wavePicture =
    getTrimmedText(wave?.picture) ??
    getTrimmedText(fallbackPfp) ??
    getTrimmedText(firstDropWave?.picture);
  const author = getWaveAuthor(wave);
  const description = getWaveDescriptionPreviewText(wave);
  const previewItems = getPreviewItems(drops);
  const waveHref = getWaveHref({ waveId, wave, curationId });
  const bannerBackground = getBannerBackground({
    banner1: wave?.author.banner1_color,
    banner2: wave?.author.banner2_color,
  });
  const hasBannerCover = bannerBackground !== null;

  return (
    <CurationPreviewShell variant={variant}>
      {hasBannerCover && (
        <div
          className={
            variant === "sheet"
              ? "tw-relative tw-h-[68px] tw-w-full tw-overflow-hidden"
              : "tw-relative tw-h-14 tw-w-full tw-overflow-hidden"
          }
          aria-hidden="true"
        >
          <div
            className="tw-absolute tw-inset-0 tw-opacity-85"
            style={{ background: bannerBackground }}
          />
          <div className="tw-absolute tw-inset-0 tw-bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.18),transparent_34%),linear-gradient(to_top,#131316_0%,rgba(19,19,22,0.42)_48%,rgba(19,19,22,0.08)_100%)]" />
        </div>
      )}
      <CurationPreviewBody hasBannerCover={hasBannerCover} variant={variant}>
        {hasBannerCover ? (
          <div className="tw-mb-3 tw-flex tw-items-center tw-gap-2.5">
            <WavePreviewPicture
              picture={wavePicture}
              sizeClassName="tw-h-10 tw-w-10"
              iconClassName="tw-h-4 tw-w-4"
              imageSize="40px"
            />
            <div className="tw-min-w-0 tw-flex-1">
              <div className="tw-line-clamp-2 tw-text-base tw-font-bold tw-leading-[1.15] tw-text-zinc-100">
                {waveName}
              </div>
              {author && (
                <div className="tw-mt-1 tw-truncate tw-text-xs tw-font-medium tw-text-zinc-400">
                  @{author}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="tw-flex tw-items-center tw-gap-3">
            <WavePreviewPicture
              picture={wavePicture}
              sizeClassName="tw-h-10 tw-w-10"
              iconClassName="tw-h-4 tw-w-4"
              imageSize="40px"
            />
            <div className="tw-min-w-0 tw-flex-1">
              <div className="tw-line-clamp-2 tw-text-base tw-font-bold tw-leading-[1.15] tw-text-zinc-100">
                {waveName}
              </div>
              {author && (
                <div className="tw-mt-1 tw-truncate tw-text-xs tw-font-medium tw-text-zinc-400">
                  @{author}
                </div>
              )}
            </div>
          </div>
        )}
        {description && (
          <p className="tw-mb-0 tw-mt-3 tw-line-clamp-2 tw-pr-1 tw-text-xs tw-font-medium tw-leading-[1.45] tw-text-zinc-300">
            {description}
          </p>
        )}

        <PreviewContent isFetching={isFetching} previewItems={previewItems} />
      </CurationPreviewBody>

      <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3">
        <Link
          href={waveHref}
          prefetch={false}
          className="tw-group/open-wave tw-inline-flex tw-items-center tw-gap-1.5 tw-text-[13px] tw-font-bold tw-text-primary-400 tw-no-underline tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-primary-300"
        >
          Open wave
          <ArrowRightIcon
            className="tw-h-3.5 tw-w-3.5 tw-transition-transform tw-duration-300 tw-ease-out desktop-hover:group-hover/open-wave:tw-translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>
    </CurationPreviewShell>
  );
};

const PreviewContent: React.FC<{
  readonly isFetching: boolean;
  readonly previewItems: ReturnType<typeof getPreviewItems>;
}> = ({ isFetching, previewItems }) => {
  if (previewItems.length > 0) {
    return (
      <div className="tw-mt-4 tw-columns-2 tw-gap-2">
        {previewItems.map((item) => (
          <PreviewTile key={item.key} item={item} />
        ))}
      </div>
    );
  }

  if (isFetching) {
    return (
      <div
        className="tw-mt-4 tw-flex tw-w-full tw-items-center tw-justify-start tw-gap-2 tw-py-1.5 tw-text-left tw-text-xs tw-text-iron-400"
        role="status"
        aria-live="polite"
      >
        <svg
          className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-animate-spin tw-text-iron-500"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="tw-opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="tw-opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Loading curated drops...</span>
      </div>
    );
  }

  return (
    <p className="tw-mb-0 tw-mt-4 tw-text-xs tw-font-semibold tw-text-iron-400">
      No curated drops yet.
    </p>
  );
};
