"use client";

import type React from "react";
import { useId, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWater } from "@fortawesome/free-solid-svg-icons";
import { FallbackImage } from "@/components/common/FallbackImage";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveDescriptionPreviewText } from "@/helpers/waves/waveDescriptionPreview";
import { useProfileWave } from "@/hooks/useProfileWave";
import { useWaveById } from "@/hooks/useWaveById";
import { useWaveCurationPreviewDrops } from "@/hooks/useWaveCurationPreviewDrops";
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
import {
  useWaveCreatorPreviewWaves,
  WaveCreatorPreviewList,
} from "./WaveCreatorPreviewList";

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
        primarySrc={getScaledImageUri(picture, ImageScale.W_AUTO_H_50)}
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

const getProfileBrainHref = (profileIdentity: string | null): string | null =>
  profileIdentity ? `/${encodeURIComponent(profileIdentity)}/brain` : null;

const getPreviewLayoutClassNames = ({
  isExpanded,
  variant,
}: {
  readonly isExpanded: boolean;
  readonly variant: CurationWavePreviewCardVariant;
}): {
  readonly layoutClassName: string;
  readonly columnClassName: string;
} => {
  if (!isExpanded) {
    return {
      layoutClassName: "",
      columnClassName: "",
    };
  }

  if (variant === "hovercard") {
    return {
      layoutClassName:
        "tw-flex tw-min-h-0 tw-flex-1 tw-flex-col min-[760px]:tw-flex-row",
      columnClassName:
        "tw-flex tw-min-h-0 tw-min-w-0 tw-w-full tw-flex-[0_1_auto] tw-flex-col min-[760px]:tw-w-[360px] min-[760px]:tw-flex-none",
    };
  }

  return {
    layoutClassName: "tw-flex tw-min-h-0 tw-flex-1 tw-flex-col",
    columnClassName:
      "tw-flex tw-min-h-0 tw-min-w-0 tw-w-full tw-flex-[0_1_auto] tw-flex-col",
  };
};

const getPreviewBodyFrameClassName = ({
  isExpanded,
  variant,
}: {
  readonly isExpanded: boolean;
  readonly variant: CurationWavePreviewCardVariant;
}): string => {
  if (!isExpanded) {
    return "";
  }

  if (variant === "hovercard") {
    return "tw-min-h-0 tw-flex-[0_1_auto] tw-overflow-y-auto min-[760px]:tw-overflow-visible";
  }

  return "tw-min-h-0 tw-flex-[0_1_auto] tw-overflow-y-auto";
};

const WavePreviewHeader: React.FC<{
  readonly hasBannerCover: boolean;
  readonly picture: string | null | undefined;
  readonly waveName: string;
  readonly author: string | null;
}> = ({ hasBannerCover, picture, waveName, author }) => {
  const pictureElement = (
    <WavePreviewPicture
      picture={picture}
      sizeClassName="tw-h-10 tw-w-10"
      iconClassName="tw-h-4 tw-w-4"
      imageSize="40px"
    />
  );
  const titleElement = (
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
  );

  if (hasBannerCover) {
    return (
      <div className="tw-mb-3 tw-flex tw-items-center tw-gap-2.5">
        {pictureElement}
        {titleElement}
      </div>
    );
  }

  return (
    <div className="tw-flex tw-items-center tw-gap-3">
      {pictureElement}
      {titleElement}
    </div>
  );
};

const CreatedWavesToggleIcon: React.FC<{
  readonly isExpanded: boolean;
  readonly variant: CurationWavePreviewCardVariant;
}> = ({ isExpanded, variant }) => {
  const Icon = variant === "hovercard" ? ChevronRightIcon : ChevronDownIcon;

  return (
    <Icon
      className={`tw-h-3.5 tw-w-3.5 tw-transition-transform tw-duration-300 tw-ease-out ${
        isExpanded ? "tw-rotate-180" : ""
      }`}
      aria-hidden="true"
    />
  );
};

const PreviewActions: React.FC<{
  readonly waveHref: string;
  readonly canShowCreatedWavesPanel: boolean;
  readonly isCreatedWavesExpanded: boolean;
  readonly createdWavesPanelId: string;
  readonly onToggleCreatedWaves: () => void;
  readonly variant: CurationWavePreviewCardVariant;
}> = ({
  waveHref,
  canShowCreatedWavesPanel,
  isCreatedWavesExpanded,
  createdWavesPanelId,
  onToggleCreatedWaves,
  variant,
}) => (
  <div className="tw-flex tw-flex-shrink-0 tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-bg-iron-950 tw-px-5 tw-py-3">
    <Link
      href={waveHref}
      prefetch={false}
      className="tw-group/open-wave tw-inline-flex tw-min-h-10 tw-items-center tw-gap-1.5 tw-text-[13px] tw-font-semibold tw-text-primary-400 tw-no-underline tw-transition-colors tw-duration-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-text-primary-300"
    >
      Open profile wave
      <ArrowRightIcon
        className="tw-h-3.5 tw-w-3.5 tw-transition-transform tw-duration-300 tw-ease-out desktop-hover:group-hover/open-wave:tw-translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
    {canShowCreatedWavesPanel && (
      <button
        type="button"
        onClick={onToggleCreatedWaves}
        aria-expanded={isCreatedWavesExpanded}
        aria-controls={createdWavesPanelId}
        className="tw-group/show-waves tw-inline-flex tw-min-h-10 tw-items-center tw-gap-1.5 tw-border-0 tw-bg-transparent tw-p-0 tw-text-[13px] tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-text-iron-50"
      >
        {isCreatedWavesExpanded && (
          <CreatedWavesToggleIcon
            isExpanded={isCreatedWavesExpanded}
            variant={variant}
          />
        )}
        {isCreatedWavesExpanded ? "Hide waves" : "Show all waves"}
        {!isCreatedWavesExpanded && (
          <CreatedWavesToggleIcon
            isExpanded={isCreatedWavesExpanded}
            variant={variant}
          />
        )}
      </button>
    )}
  </div>
);

export const CurationWavePreviewCard: React.FC<
  CurationWavePreviewCardProps
> = ({
  waveId,
  profileIdentity,
  fallbackName,
  fallbackPfp,
  variant = "hovercard",
}) => {
  const createdWavesPanelId = useId();
  const [areCreatedWavesOpen, setAreCreatedWavesOpen] = useState(false);
  const normalizedProfileIdentity = getTrimmedText(profileIdentity);
  const { wave, isError: isWaveError } = useWaveById(waveId);
  const resolvedWave = wave?.id === waveId ? wave : undefined;
  const { data: profileWave, isError: isProfileWaveError } = useProfileWave({
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
  const {
    data: curations = [],
    isError: isCurationsError,
    isFetched: areCurationsFetched,
  } = useWaveCurations({
    waveId,
    enabled: shouldLoadFallbackCurations,
  });
  const fallbackCurationId = shouldLoadFallbackCurations
    ? (curations.at(0)?.id ?? null)
    : null;
  const curationId = selectedProfileCurationId ?? fallbackCurationId;
  const canFetchPreviewDrops =
    hasResolvedProfileWave && curationId !== null && resolvedWave !== undefined;
  const {
    drops,
    isError: isDropsError,
    isFetched: areDropsFetched,
  } = useWaveCurationPreviewDrops({
    wave: resolvedWave ?? null,
    curationId,
    pageSize: PREVIEW_DROPS_FETCH_LIMIT,
    enabled: canFetchPreviewDrops,
  });

  const isProfileWaveUnresolved =
    normalizedProfileIdentity !== null &&
    profileWave === undefined &&
    !isProfileWaveError;
  const areFallbackCurationsUnresolved =
    shouldLoadFallbackCurations && !areCurationsFetched && !isCurationsError;
  const areWaveDetailsUnresolved =
    curationId !== null && resolvedWave === undefined && !isWaveError;
  const arePreviewDropsUnresolved =
    canFetchPreviewDrops && !areDropsFetched && !isDropsError;
  const isPreviewPending =
    isProfileWaveUnresolved ||
    areFallbackCurationsUnresolved ||
    areWaveDetailsUnresolved ||
    arePreviewDropsUnresolved;
  const firstDropWave = drops.at(0)?.wave;
  const waveName =
    getTrimmedText(resolvedWave?.name) ??
    getTrimmedText(fallbackName) ??
    getTrimmedText(firstDropWave?.name) ??
    "Featured wave";
  const wavePicture =
    getTrimmedText(resolvedWave?.picture) ??
    getTrimmedText(fallbackPfp) ??
    getTrimmedText(firstDropWave?.picture);
  const author = getWaveAuthor(resolvedWave);
  const description = getWaveDescriptionPreviewText(resolvedWave);
  const previewItems = getPreviewItems(drops);
  const waveHref = getWaveHref({ waveId, wave: resolvedWave, curationId });
  const profileBrainHref = getProfileBrainHref(normalizedProfileIdentity);
  const canShowCreatedWavesPanel =
    normalizedProfileIdentity !== null && profileBrainHref !== null;
  const isCreatedWavesExpanded =
    canShowCreatedWavesPanel && areCreatedWavesOpen;
  const {
    layoutClassName: previewLayoutClassName,
    columnClassName: previewColumnClassName,
  } = getPreviewLayoutClassNames({
    isExpanded: isCreatedWavesExpanded,
    variant,
  });
  const previewBodyFrameClassName = getPreviewBodyFrameClassName({
    isExpanded: isCreatedWavesExpanded,
    variant,
  });
  const bannerBackground = getBannerBackground({
    banner1: resolvedWave?.author.banner1_color,
    banner2: resolvedWave?.author.banner2_color,
  });
  const hasBannerCover = bannerBackground !== null;
  const onToggleCreatedWaves = () =>
    setAreCreatedWavesOpen((current) => !current);

  return (
    <CurationPreviewShell variant={variant} expanded={isCreatedWavesExpanded}>
      <div className={previewLayoutClassName}>
        <div className={previewColumnClassName}>
          <div className={previewBodyFrameClassName}>
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
            <CurationPreviewBody
              hasBannerCover={hasBannerCover}
              variant={variant}
            >
              <WavePreviewHeader
                hasBannerCover={hasBannerCover}
                picture={wavePicture}
                waveName={waveName}
                author={author}
              />
              {description && (
                <p className="tw-mb-0 tw-mt-3 tw-line-clamp-2 tw-pr-1 tw-text-xs tw-font-medium tw-leading-[1.45] tw-text-zinc-300">
                  {description}
                </p>
              )}

              <PreviewContent
                isPending={isPreviewPending}
                previewItems={previewItems}
              />
            </CurationPreviewBody>
          </div>

          <PreviewActions
            waveHref={waveHref}
            canShowCreatedWavesPanel={canShowCreatedWavesPanel}
            isCreatedWavesExpanded={isCreatedWavesExpanded}
            createdWavesPanelId={createdWavesPanelId}
            onToggleCreatedWaves={onToggleCreatedWaves}
            variant={variant}
          />
        </div>
        {isCreatedWavesExpanded && (
          <CreatedWavesPanel
            id={createdWavesPanelId}
            identity={normalizedProfileIdentity}
            profileBrainHref={profileBrainHref}
            variant={variant}
          />
        )}
      </div>
    </CurationPreviewShell>
  );
};

const CreatedWavesPanel: React.FC<{
  readonly id: string;
  readonly identity: string;
  readonly profileBrainHref: string;
  readonly variant: CurationWavePreviewCardVariant;
}> = ({ id, identity, profileBrainHref, variant }) => {
  const wavesState = useWaveCreatorPreviewWaves({
    identity,
    enabled: true,
  });
  const isSheet = variant === "sheet";

  return (
    <section
      id={id}
      aria-label="Created waves"
      className={`tw-flex tw-min-h-0 tw-min-w-0 tw-flex-[1_1_14rem] tw-flex-col ${
        isSheet
          ? "tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-4"
          : "tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-p-4 min-[760px]:tw-w-[360px] min-[760px]:tw-flex-none min-[760px]:tw-flex-shrink-0 min-[760px]:tw-border-l min-[760px]:tw-border-t-0"
      }`}
    >
      <div className="tw-flex tw-flex-col tw-items-start tw-justify-between tw-gap-3 min-[420px]:tw-flex-row">
        <div className="tw-min-w-0">
          <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
            Created waves
          </div>
        </div>
        <Link
          href={profileBrainHref}
          prefetch={false}
          className="tw-inline-flex tw-min-h-8 tw-flex-shrink-0 tw-items-center tw-gap-1 tw-text-xs tw-font-semibold tw-text-primary-400 tw-no-underline tw-transition-colors tw-duration-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-text-primary-300"
        >
          Show all brain activity
          <ArrowRightIcon className="tw-h-3 tw-w-3" aria-hidden="true" />
        </Link>
      </div>
      <div
        className={`tw-mt-3 tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-pr-1 tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-700 desktop-hover:hover:tw-scrollbar-thumb-iron-500 ${
          isSheet
            ? "tw-max-h-none"
            : "min-[760px]:tw-max-h-[320px] min-[760px]:tw-flex-none"
        }`}
      >
        <WaveCreatorPreviewList state={wavesState} variant="compact" />
      </div>
    </section>
  );
};

const PreviewContent: React.FC<{
  readonly isPending: boolean;
  readonly previewItems: ReturnType<typeof getPreviewItems>;
}> = ({ isPending, previewItems }) => {
  if (previewItems.length > 0) {
    return (
      <div className="tw-mt-4 tw-columns-1 tw-gap-2 sm:tw-columns-2">
        {previewItems.map((item) => (
          <PreviewTile key={item.key} item={item} />
        ))}
      </div>
    );
  }

  if (isPending) {
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
        <span>Loading...</span>
      </div>
    );
  }

  return null;
};
