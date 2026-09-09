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
import { motion, useReducedMotion } from "framer-motion";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { podiumPositionStyles, podiumSurfaceClassName } from "./podiumStyles";
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
  readonly fallbackTextClass?: string | undefined;
}

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

const animationIndexMap: Record<WavePodiumItemProps["position"], number> = {
  first: 0,
  second: 1,
  third: 2,
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
    comparableIdentity: identityProfile ?? {
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
        className={`${className} ${ringWidthClass} ${ringClass} tw-object-cover`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${className} ${ringWidthClass} ${ringClass} tw-flex tw-items-center tw-justify-center tw-bg-iron-900`}
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
  const styles = podiumPositionStyles[position];
  const hoverTextColorClass = styles.hoverTextColor;
  const reduceMotion = useReducedMotion();
  const locale = useBrowserLocale();

  // If no winner provided, render placeholder
  if (!winner) {
    return <WaveWinnersPodiumPlaceholder position={position} />;
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
      className="tw-h-full tw-min-w-0"
      variants={podiumVariants}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      custom={animationIndex}
    >
      <div className="tw-group tw-relative tw-isolate tw-h-full tw-min-w-0">
        <button
          type="button"
          onClick={() => onDropClick(drop)}
          aria-label={t(locale, "waves.leaderboard.grid.openNamed", {
            title: `${styles.positionText} ${primaryLabel}`,
          })}
          className="tw-absolute tw-inset-0 tw-z-0 tw-cursor-pointer tw-rounded-xl tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        />
        <div className="tw-pointer-events-none tw-relative tw-z-10 tw-flex tw-h-full tw-min-w-0 tw-flex-col tw-items-center [&_a]:tw-pointer-events-auto [&_button]:tw-pointer-events-auto">
          <div className="tw-relative tw-z-10 -tw-mb-4 tw-flex tw-flex-shrink-0 tw-flex-col tw-items-center">
            {identityDisplay ? (
              <div className="motion-safe:tw-transition-transform motion-safe:tw-duration-200 motion-safe:group-hover:desktop-hover:tw-scale-[1.02]">
                <PodiumAvatar
                  label={primaryLabel}
                  pfp={primaryPfp}
                  alt={`${primaryLabel} avatar`}
                  width={56}
                  height={56}
                  className={`${styles.pfpSize} tw-rounded-xl`}
                  ringClass={styles.ring}
                />
              </div>
            ) : (
              <Link
                href={authorProfileHref}
                aria-label={authorProfileLabel}
                onClick={(e) => e.stopPropagation()}
                className="tw-rounded-xl focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400 motion-safe:tw-transition-transform motion-safe:desktop-hover:hover:tw-scale-105"
              >
                <PodiumAvatar
                  label={authorProfileLabel}
                  pfp={drop.author.pfp}
                  alt={`${authorProfileLabel} avatar`}
                  width={56}
                  height={56}
                  className={`${styles.pfpSize} tw-rounded-xl`}
                  ringClass={styles.ring}
                />
              </Link>
            )}

            <div className="tw-absolute tw-inset-x-0 -tw-bottom-3 tw-flex tw-justify-center">
              <div className="tw-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-2 tw-py-1 tw-shadow-sm">
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

          <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-1">
            <div
              className={`${styles.height} ${podiumSurfaceClassName} tw-gap-y-3 tw-transition-colors desktop-hover:group-hover:tw-border-iron-600`}
            >
              <div
                aria-hidden="true"
                className={`tw-pointer-events-none tw-absolute tw-inset-0 tw-rounded-xl tw-bg-gradient-to-b ${styles.surface} tw-to-transparent`}
              />

              {identityDisplay ? (
                <div className="tw-relative tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-gap-y-1">
                  {identityDisplay.profileUser ? (
                    <UserProfileTooltipWrapper
                      user={identityDisplay.profileUser}
                    >
                      <Link
                        href={getIdentityHref(identityDisplay.profileUser)}
                        onClick={(e) => e.stopPropagation()}
                        className={`tw-relative tw-flex tw-min-h-8 tw-min-w-0 tw-max-w-full tw-items-center tw-justify-center tw-gap-1 tw-rounded-md tw-text-center tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${hoverTextColorClass} tw-group/link`}
                      >
                        <span
                          title={primaryLabel}
                          className={`${styles.authorFontSize} tw-block tw-max-w-full tw-whitespace-normal tw-break-words tw-font-semibold tw-leading-tight tw-text-iron-100 [overflow-wrap:anywhere] ${hoverTextColorClass} tw-transition-colors`}
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
                          className={`tw-size-3 tw-opacity-0 tw-transition-opacity ${styles.textColor} tw-flex-shrink-0 group-focus-visible/link:tw-opacity-100 desktop-hover:group-hover/link:tw-opacity-100 touch-only:tw-opacity-100`}
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
                      className={`${styles.authorFontSize} tw-block tw-max-w-full tw-whitespace-normal tw-break-words tw-text-center tw-font-semibold tw-leading-tight tw-text-iron-100 [overflow-wrap:anywhere]`}
                    >
                      {primaryLabel}
                    </span>
                  )}

                  <div className="tw-flex tw-max-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-x-1 tw-gap-y-1 tw-text-xs tw-text-iron-500">
                    {isSelfNominated ? (
                      <span className="tw-font-normal tw-text-iron-400 [overflow-wrap:anywhere]">
                        self-nominated
                      </span>
                    ) : (
                      <>
                        <span className="tw-font-normal tw-text-iron-400 [overflow-wrap:anywhere]">
                          nominated by
                        </span>

                        <UserProfileTooltipWrapper user={authorTooltipUser}>
                          <Link
                            href={authorProfileHref}
                            onClick={(e) => e.stopPropagation()}
                            className="tw-inline-flex tw-min-h-8 tw-min-w-0 tw-max-w-full tw-items-center tw-rounded-md tw-text-center tw-text-iron-300 tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-200"
                          >
                            <span
                              title={authorProfileLabel}
                              className="tw-block tw-max-w-full tw-whitespace-normal tw-text-xs tw-font-medium tw-text-iron-400 tw-transition-colors [overflow-wrap:anywhere] desktop-hover:hover:tw-text-iron-200"
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
                    className={`tw-relative tw-flex tw-min-h-8 tw-min-w-0 tw-max-w-full tw-items-center tw-justify-center tw-gap-1 tw-rounded-md tw-text-center tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${hoverTextColorClass} tw-group/link`}
                  >
                    <span
                      className={`${styles.authorFontSize} tw-block tw-max-w-full tw-whitespace-normal tw-break-words tw-text-center tw-font-semibold tw-leading-tight tw-text-iron-200 [overflow-wrap:anywhere] ${hoverTextColorClass} tw-transition-colors`}
                    >
                      {authorProfileLabel}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className={`tw-size-3 tw-opacity-0 tw-transition-opacity ${styles.textColor} tw-flex-shrink-0 group-focus-visible/link:tw-opacity-100 desktop-hover:group-hover/link:tw-opacity-100 touch-only:tw-opacity-100`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
                      />
                    </svg>
                  </Link>
                </UserProfileTooltipWrapper>
              )}

              <div className="tw-relative tw-mt-auto tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-gap-y-2">
                <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-wrap tw-items-baseline tw-justify-center tw-gap-x-1 tw-text-center">
                  <span
                    className={`${
                      drop.rating >= 0 ? styles.textColor : "tw-text-error"
                    } tw-min-w-0 tw-max-w-full tw-text-sm tw-font-semibold tw-tabular-nums [overflow-wrap:anywhere] sm:tw-text-base`}
                  >
                    {formatNumberWithCommas(drop.rating)}
                  </span>
                  <span className="tw-text-xs tw-text-iron-400 sm:tw-text-sm">
                    {WAVE_VOTING_LABELS[drop.wave.voting_credit_type]}
                  </span>
                </div>

                <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-gap-y-2">
                  {showVoteDetails ? (
                    <ParticipationDropVoteDetailsTrigger
                      drop={drop}
                      density="podium"
                    />
                  ) : (
                    <div className="tw-flex tw-max-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-x-1 tw-text-center [overflow-wrap:anywhere]">
                      <span className="tw-text-xs tw-text-iron-200 sm:tw-text-sm">
                        {formatNumberWithCommas(drop.raters_count)}
                      </span>
                      <span className="tw-text-xs tw-text-iron-400 sm:tw-text-sm">
                        {drop.raters_count === 1 ? "voter" : "voters"}
                      </span>
                    </div>
                  )}

                  <div className="tw-max-w-full">
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
