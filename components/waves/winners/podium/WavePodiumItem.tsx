import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getDropIdentityFallbackValue,
  getDropIdentityProfile,
} from "@/components/waves/drops/identityDisplay.helpers";
import { areSameProfileIdentity } from "@/helpers/ProfileHelpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { ImageScale, getScaledImageUri } from "@/helpers/image.helpers";
import { WavePodiumItemContentOutcomes } from "./WavePodiumItemContentOutcomes";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { motion } from "framer-motion";
import { WaveWinnersPodiumPlaceholder } from "./WaveWinnersPodiumPlaceholder";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import ParticipationDropVoteDetailsTrigger from "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger";

interface WavePodiumItemProps {
  readonly winner?: ApiWaveDecisionWinner | undefined;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly position: "first" | "second" | "third";
  readonly customAnimationIndex?: number | undefined;
  readonly showVoteDetails?: boolean | undefined;
  readonly outcomesVisible?: boolean | undefined;
}

interface PodiumAvatarProps {
  readonly label: string;
  readonly pfp: string | null | undefined;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly className: string;
  readonly ringClass: string;
  readonly ringWidthClass?: string | undefined;
  readonly shadowClass?: string | undefined;
  readonly fallbackTextClass?: string | undefined;
}

// Configuration for position-specific styling with CSS ready classes for Tailwind
const positionStyles = {
  first: {
    color: "#fbbf24", // amber-400 - Gold from WinnerDropBadge
    height: "tw-h-[220px]",
    pfpSize: "tw-size-12 md:tw-size-14",
    marginBottom: "-tw-mb-6",
    textColor: "tw-text-[#fbbf24]",
    ring: "tw-ring-[#fbbf24]",
    shadow: "tw-shadow-[0_0_20px_rgba(251,191,36,0.3)]",
    autorFontSize: "tw-text-sm sm:tw-text-base md:tw-text-xl",
    ratingFontSize: "tw-text-sm sm:tw-text-base md:tw-text-2xl",
    positionText: "1st",
    bgGradient:
      "tw-bg-gradient-to-b tw-from-[#fbbf24]/20 tw-to-transparent tw-blur-2xl tw-scale-150",
    gradient: {
      from: "tw-from-[#fbbf24]/5",
      via: "tw-via-[#fbbf24]/3",
      hover: "group-hover:desktop-hover:tw-from-[#fbbf24]/[0.07]",
      top: "tw-via-[#fbbf24]/10",
      hover25: "group-hover:desktop-hover:tw-via-[#fbbf24]/25",
      sides: "tw-from-[#fbbf24]/10 tw-via-[#fbbf24]/5",
      sidesHover: "group-hover:desktop-hover:tw-via-[#fbbf24]/25",
    },
  },
  second: {
    color: "#94a3b8", // slate-400 - Silver from WinnerDropBadge
    height: "tw-h-[190px]",
    pfpSize: "tw-size-9 md:tw-size-11",
    marginBottom: "-tw-mb-2",
    textColor: "tw-text-[#94a3b8]",
    ring: "tw-ring-[#94a3b8]",
    shadow: "tw-shadow-[0_0_20px_rgba(148,163,184,0.3)]",
    autorFontSize: "tw-text-sm sm:tw-text-base",
    ratingFontSize: "tw-text-sm sm:tw-text-base",
    positionText: "2nd",
    bgGradient:
      "tw-bg-gradient-to-b tw-from-[#94a3b8]/20 tw-to-transparent tw-blur-2xl tw-scale-150",
    gradient: {
      from: "tw-from-[#94a3b8]/5",
      via: "tw-via-[#94a3b8]/3",
      hover: "group-hover:desktop-hover:tw-from-[#94a3b8]/[0.07]",
      top: "tw-via-[#94a3b8]/10",
      hover25: "group-hover:desktop-hover:tw-via-[#94a3b8]/25",
      sides: "tw-from-[#94a3b8]/10 tw-via-[#94a3b8]/5",
      sidesHover: "group-hover:desktop-hover:tw-via-[#94a3b8]/25",
    },
  },
  third: {
    color: "#CD7F32", // Bronze (same in both components)
    height: "tw-h-[170px]",
    pfpSize: "tw-size-9 md:tw-size-11",
    marginBottom: "-tw-mb-2",
    textColor: "tw-text-[#CD7F32]",
    ring: "tw-ring-[#CD7F32]",
    shadow: "tw-shadow-[0_0_20px_rgba(205,127,50,0.3)]",
    autorFontSize: "tw-text-sm sm:tw-text-base",
    ratingFontSize: "tw-text-base",
    positionText: "3rd",
    bgGradient:
      "tw-bg-gradient-to-b tw-from-[#CD7F32]/20 tw-to-transparent tw-blur-2xl tw-scale-150",
    gradient: {
      from: "tw-from-[#CD7F32]/5",
      via: "tw-via-[#CD7F32]/3",
      hover: "group-hover:desktop-hover:tw-from-[#CD7F32]/[0.07]",
      top: "tw-via-[#CD7F32]/10",
      hover25: "group-hover:desktop-hover:tw-via-[#CD7F32]/25",
      sides: "tw-from-[#CD7F32]/10 tw-via-[#CD7F32]/5",
      sidesHover: "group-hover:desktop-hover:tw-via-[#CD7F32]/25",
    },
  },
};

// Animation variants for the podium items
const podiumVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.2, 0.9, 0.3, 1],
      opacity: { duration: 0.25 },
    },
  }),
};

// Height mapping for different positions
const heightMap = {
  first: "tw-h-[220px]",
  second: "tw-h-[190px]",
  third: "tw-h-[170px]",
};

const animationIndexMap: Record<WavePodiumItemProps["position"], number> = {
  first: 0,
  second: 1,
  third: 2,
};

const getHoverTextColorClass = (position: WavePodiumItemProps["position"]) => {
  const colorMap = {
    first: "desktop-hover:hover:tw-text-[#fbbf24]",
    second: "desktop-hover:hover:tw-text-[#94a3b8]",
    third: "desktop-hover:hover:tw-text-[#CD7F32]",
  } as const;

  return colorMap[position];
};

const getAuthorProfileLabel = (drop: ExtendedDrop): string =>
  drop.author.handle ?? drop.author.primary_address;

const getAuthorTooltipUser = (drop: ExtendedDrop): string =>
  drop.author.handle ?? drop.author.primary_address;

const getIdentityHref = (value: string) =>
  `/${encodeURIComponent(value.toLowerCase())}`;

const getPodiumIdentityDisplay = (drop: ExtendedDrop) => {
  const identityProfile = getDropIdentityProfile({
    wave: drop.wave,
    metadata: drop.metadata,
  });
  const fallbackValue = identityProfile
    ? null
    : getDropIdentityFallbackValue({
        wave: drop.wave,
        metadata: drop.metadata,
      });
  const label =
    identityProfile?.handle ??
    identityProfile?.primary_address ??
    fallbackValue;

  if (!label) {
    return null;
  }

  return {
    label,
    pfp: identityProfile?.pfp ?? null,
    profileUser:
      identityProfile?.handle ?? identityProfile?.primary_address ?? null,
    comparableIdentity:
      identityProfile ?? {
        handle: fallbackValue,
        primary_address: fallbackValue,
      },
  };
};

const PodiumAvatar: React.FC<PodiumAvatarProps> = ({
  label,
  pfp,
  alt,
  width,
  height,
  className,
  ringClass,
  ringWidthClass = "tw-ring-2",
  shadowClass,
  fallbackTextClass = "tw-text-xs tw-font-semibold tw-text-iron-100",
}) => {
  const initial = label.trim().charAt(0).toUpperCase() || "?";

  if (pfp) {
    return (
      <Image
        src={getScaledImageUri(pfp, ImageScale.W_AUTO_H_50)}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${ringWidthClass} ${ringClass} tw-object-cover ${shadowClass ?? ""}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${className} ${ringWidthClass} ${ringClass} ${shadowClass ?? ""} tw-flex tw-items-center tw-justify-center tw-bg-iron-900`}
    >
      <span className={fallbackTextClass}>{initial}</span>
    </div>
  );
};

export const WavePodiumItem: React.FC<WavePodiumItemProps> = ({
  winner,
  onDropClick,
  position,
  customAnimationIndex,
  showVoteDetails = true,
  outcomesVisible = true,
}) => {
  const styles = positionStyles[position];
  const hoverTextColorClass = getHoverTextColorClass(position);

  // If no winner provided, render placeholder
  if (!winner) {
    return (
      <WaveWinnersPodiumPlaceholder
        height={heightMap[position]}
        position={position}
      />
    );
  }

  const drop = winner.drop as ExtendedDrop;
  const animationIndex = customAnimationIndex ?? animationIndexMap[position];
  const authorProfileLabel = getAuthorProfileLabel(drop);
  const authorTooltipUser = getAuthorTooltipUser(drop);
  const authorProfileHref = `/${authorProfileLabel}`;
  const identityDisplay = getPodiumIdentityDisplay(drop);
  const primaryLabel = identityDisplay?.label ?? authorProfileLabel;
  const primaryPfp = identityDisplay ? identityDisplay.pfp : drop.author.pfp;
  const isSelfNominated = identityDisplay
    ? areSameProfileIdentity({
        left: drop.author,
        right: identityDisplay.comparableIdentity,
      })
    : false;

  return (
    <motion.div
      variants={podiumVariants}
      initial="hidden"
      animate="visible"
      custom={animationIndex}
    >
      <div
        onClick={() => onDropClick(drop)}
        className="tw-group tw-cursor-pointer"
      >
        <div className="tw-flex tw-flex-col tw-items-center">
          <div
            className={`tw-flex tw-flex-col tw-items-center ${styles.marginBottom} tw-relative tw-z-10`}
          >
            <div className={`tw-absolute tw-inset-0 ${styles.bgGradient}`} />
            {identityDisplay ? (
              <div className="tw-transform tw-transition-transform tw-duration-300 group-hover:desktop-hover:tw-scale-[1.02]">
                <PodiumAvatar
                  label={primaryLabel}
                  pfp={primaryPfp}
                  alt={`${primaryLabel} avatar`}
                  width={56}
                  height={56}
                  className={`${styles.pfpSize} tw-rounded-xl`}
                  ringClass={styles.ring}
                  shadowClass={styles.shadow}
                />
              </div>
            ) : (
              <Link
                href={authorProfileHref}
                onClick={(e) => e.stopPropagation()}
                className="tw-transform tw-transition-all tw-duration-300 hover:tw-scale-105"
              >
                <PodiumAvatar
                  label={authorProfileLabel}
                  pfp={drop.author.pfp}
                  alt={`${authorProfileLabel} avatar`}
                  width={56}
                  height={56}
                  className={`${styles.pfpSize} tw-rounded-xl`}
                  ringClass={styles.ring}
                  shadowClass={styles.shadow}
                />
              </Link>
            )}

            <div className="tw-absolute tw-inset-x-0 -tw-bottom-3 tw-flex tw-justify-center">
              <div className="tw-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900/80 tw-px-3 tw-py-1 tw-shadow-lg tw-backdrop-blur-sm">
                <svg
                  className={`tw-w-3 md:tw-size-4 ${styles.textColor}`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 576 512"
                >
                  <path
                    fill="currentColor"
                    d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                  />
                </svg>
                <span
                  className={`${styles.textColor} tw-text-xs tw-font-medium lg:tw-text-sm`}
                >
                  {styles.positionText}
                </span>
              </div>
            </div>
          </div>

          <div className="tw-relative tw-w-full">
            <div
              className={`${styles.height} tw-relative tw-flex tw-flex-col tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-xl tw-border tw-border-iron-800/60 tw-bg-gradient-to-b tw-from-iron-900/70 tw-via-iron-900/50 tw-to-transparent tw-shadow-[0_4px_24px_rgba(0,0,0,0.2)] tw-backdrop-blur-xl tw-transition-all tw-duration-300 tw-ease-out group-hover:desktop-hover:tw-border-iron-700/70 group-hover:desktop-hover:tw-from-iron-900/75 group-hover:desktop-hover:tw-via-iron-900/55 group-hover:desktop-hover:tw-to-transparent group-hover:desktop-hover:tw-shadow-[0_0_48px_rgba(0,0,0,0.35)]`}
            >
              <div className="tw-absolute tw-inset-0">
                <div
                  className={`tw-absolute tw-inset-0 tw-bg-gradient-to-b ${styles.gradient.from} ${styles.gradient.via} tw-to-transparent ${styles.gradient.hover}`}
                />
                <div
                  className={`tw-absolute tw-inset-x-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent ${styles.gradient.top} tw-to-transparent ${styles.gradient.hover25}`}
                />
                <div
                  className={`tw-absolute tw-inset-y-0 tw-right-0 tw-w-px tw-bg-gradient-to-b ${styles.gradient.sides} tw-to-transparent ${styles.gradient.sidesHover}`}
                />
                <div
                  className={`tw-absolute tw-inset-y-0 tw-left-0 tw-w-px tw-bg-gradient-to-b ${styles.gradient.sides} tw-to-transparent ${styles.gradient.sidesHover}`}
                />
                <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-3/4 tw-bg-gradient-to-t tw-from-black/20 tw-via-black/10 tw-to-transparent" />
              </div>

              {identityDisplay ? (
                <div className="tw-mb-2 tw-mt-2 tw-flex tw-max-w-full tw-flex-col tw-items-center tw-gap-y-1 tw-px-3 sm:tw-mt-3">
                  {identityDisplay.profileUser ? (
                    <UserProfileTooltipWrapper
                      user={identityDisplay.profileUser}
                    >
                      <Link
                        href={getIdentityHref(identityDisplay.profileUser)}
                        onClick={(e) => e.stopPropagation()}
                        className={`tw-relative tw-block tw-max-w-full tw-text-center tw-no-underline tw-transition-all ${hoverTextColorClass} tw-group/link`}
                      >
                        <span
                          title={primaryLabel}
                          className={`${styles.autorFontSize} tw-block tw-max-w-full tw-truncate tw-font-semibold tw-text-iron-100 ${hoverTextColorClass} tw-transition-colors`}
                        >
                          {primaryLabel}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className={`tw-size-3 tw-opacity-0 tw-transition-opacity ${styles.textColor} tw-absolute tw-left-[100%] tw-top-1/2 tw-ml-2 -tw-translate-y-1/2 desktop-hover:group-hover/link:tw-opacity-100`}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
                          />
                        </svg>
                      </Link>
                    </UserProfileTooltipWrapper>
                  ) : (
                    <span
                      title={primaryLabel}
                      className={`${styles.autorFontSize} tw-block tw-max-w-full tw-truncate tw-text-center tw-font-semibold tw-text-iron-100`}
                    >
                      {primaryLabel}
                    </span>
                  )}

                  <div className="tw-flex tw-max-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-x-1 tw-gap-y-1 tw-text-[11px] tw-text-iron-500">
                    {isSelfNominated ? (
                      <span className="tw-font-normal tw-text-iron-500">
                        self-nominated
                      </span>
                    ) : (
                      <>
                        <span className="tw-font-normal tw-text-iron-500">
                          nominated by
                        </span>

                        <UserProfileTooltipWrapper user={authorTooltipUser}>
                          <Link
                            href={authorProfileHref}
                            onClick={(e) => e.stopPropagation()}
                            className="tw-inline-flex tw-max-w-full tw-items-center tw-text-iron-400 tw-no-underline tw-transition-colors desktop-hover:hover:tw-text-iron-200"
                          >
                            <span
                              title={authorProfileLabel}
                              className="tw-block tw-max-w-[7rem] tw-truncate tw-text-[11px] tw-font-medium tw-text-iron-400 tw-transition-colors desktop-hover:hover:tw-text-iron-200"
                            >
                              {authorProfileLabel}
                            </span>
                          </Link>
                        </UserProfileTooltipWrapper>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <UserProfileTooltipWrapper user={authorTooltipUser}>
                  <Link
                    href={authorProfileHref}
                    onClick={(e) => e.stopPropagation()}
                    className={`tw-relative tw-mb-2 tw-mt-2 tw-text-center tw-no-underline tw-transition-all sm:tw-mt-4 ${hoverTextColorClass} tw-group/link`}
                  >
                    <span
                      className={`${styles.autorFontSize} tw-font-semibold tw-text-iron-200 ${hoverTextColorClass} tw-inline-flex tw-items-center tw-transition-colors`}
                    >
                      {authorProfileLabel}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className={`tw-size-3 tw-opacity-0 tw-transition-opacity ${styles.textColor} tw-absolute tw-left-[100%] tw-ml-2 desktop-hover:group-hover/link:tw-opacity-100`}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
                        />
                      </svg>
                    </span>
                  </Link>
                </UserProfileTooltipWrapper>
              )}

              <div className="tw-relative tw-flex tw-flex-col tw-items-center tw-gap-y-2">
                <div className="tw-flex tw-items-center tw-gap-x-1">
                  <span
                    className={`${
                      drop.rating >= 0 ? styles.textColor : "tw-text-[#ff4466]"
                    } tw-font-semibold ${styles.ratingFontSize}`}
                  >
                    {formatNumberWithCommas(drop.rating)}
                  </span>
                  <span className="tw-text-xs tw-text-iron-400 sm:tw-text-sm">
                    {WAVE_VOTING_LABELS[drop.wave.voting_credit_type]}
                  </span>
                </div>

                <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-2">
                  {showVoteDetails ? (
                    <ParticipationDropVoteDetailsTrigger
                      drop={drop}
                      density="compact"
                    />
                  ) : (
                    <div className="tw-flex tw-items-center tw-gap-x-1">
                      <span className="tw-text-xs tw-text-iron-200 sm:tw-text-sm">
                        {formatNumberWithCommas(drop.raters_count)}
                      </span>
                      <span className="tw-text-xs tw-text-iron-400 sm:tw-text-sm">
                        {drop.raters_count === 1 ? "voter" : "voters"}
                      </span>
                    </div>
                  )}

                  <div onClick={(e) => e.stopPropagation()}>
                    <WavePodiumItemContentOutcomes
                      winner={winner}
                      outcomesVisible={outcomesVisible}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
