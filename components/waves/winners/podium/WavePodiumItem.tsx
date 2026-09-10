import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getDropIdentityFallbackValue,
  getDropIdentityProfile,
} from "@/components/waves/drops/identityDisplay.helpers";
import { areSameProfileIdentity } from "@/helpers/ProfileHelpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ImageScale, getScaledImageUri } from "@/helpers/image.helpers";
import { WavePodiumItemContentOutcomes } from "./WavePodiumItemContentOutcomes";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { motion, useReducedMotion } from "framer-motion";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t, tRich } from "@/i18n/messages";
import { podiumPositionStyles, podiumSurfaceClassName } from "./podiumStyles";
import { WaveWinnersPodiumPlaceholder } from "./WaveWinnersPodiumPlaceholder";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import ParticipationDropVoteDetailsTrigger from "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";

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

const podiumOpenMessageKeys = {
  first: "waves.leaderboard.podium.open.first",
  second: "waves.leaderboard.podium.open.second",
  third: "waves.leaderboard.podium.open.third",
} as const;

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
  const authorProfileHref = getIdentityHref(authorProfileLabel);
  const identityDisplay = getPodiumIdentityDisplay(drop);
  const primaryLabel = identityDisplay?.label ?? authorProfileLabel;
  const primaryPfp = identityDisplay ? identityDisplay.pfp : drop.author.pfp;
  const voterMessageKey =
    new Intl.PluralRules(locale).select(drop.raters_count) === "one"
      ? "waves.leaderboard.grid.voters.one"
      : "waves.leaderboard.grid.voters.other";
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
          aria-label={t(locale, podiumOpenMessageKeys[position], {
            name: primaryLabel,
          })}
          className="tw-absolute tw-inset-0 tw-z-0 tw-cursor-pointer tw-rounded-t-xl tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        />
        {/* Plain content passes pointer input to the sibling open button. */}
        <div className="tw-pointer-events-none tw-relative tw-z-10 tw-flex tw-h-full tw-min-w-0 tw-flex-col tw-items-center [&_a]:tw-pointer-events-auto [&_button]:tw-pointer-events-auto">
          <div
            className={`${styles.pfpOverlap} tw-relative tw-z-20 tw-flex tw-flex-shrink-0 tw-flex-col tw-items-center`}
          >
            {identityDisplay ? (
              <div className="motion-safe:tw-transition-transform motion-safe:tw-duration-200 motion-safe:group-hover:desktop-hover:tw-scale-[1.025]">
                <PodiumAvatar
                  label={primaryLabel}
                  pfp={primaryPfp}
                  alt={t(locale, "waves.leaderboard.podium.avatar", {
                    name: primaryLabel,
                  })}
                  width={80}
                  height={80}
                  className={`${styles.pfpSize} tw-rounded-full tw-shadow-[0_12px_36px_rgba(0,0,0,0.35)]`}
                  ringClass={styles.ring}
                  ringWidthClass={
                    position === "first" ? "tw-ring-2" : "tw-ring-1"
                  }
                />
              </div>
            ) : (
              <Link
                href={authorProfileHref}
                aria-label={authorProfileLabel}
                onClick={(e) => e.stopPropagation()}
                className="tw-rounded-full focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400 motion-safe:tw-transition-transform motion-safe:desktop-hover:hover:tw-scale-[1.025]"
              >
                <PodiumAvatar
                  label={authorProfileLabel}
                  pfp={drop.author.pfp}
                  alt={t(locale, "waves.leaderboard.podium.avatar", {
                    name: authorProfileLabel,
                  })}
                  width={80}
                  height={80}
                  className={`${styles.pfpSize} tw-rounded-full tw-shadow-[0_12px_36px_rgba(0,0,0,0.35)]`}
                  ringClass={styles.ring}
                  ringWidthClass={
                    position === "first" ? "tw-ring-2" : "tw-ring-1"
                  }
                />
              </Link>
            )}

            <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-flex tw-translate-y-1 tw-justify-center sm:tw-translate-y-0">
              <WinnerDropBadge
                rank={winner.place}
                decisionTime={null}
                surface="solid"
              />
            </div>
          </div>

          <div
            className={`${styles.height} ${styles.surface} ${podiumSurfaceClassName} desktop-hover:group-hover:-tw-translate-y-0.5 desktop-hover:group-hover:tw-border-white/[0.14]`}
          >
            <div
              aria-hidden="true"
              className={`tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-b ${styles.gradient} tw-to-transparent`}
            />

            <div className="tw-relative tw-flex tw-w-full tw-min-w-0 tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-gap-y-2 tw-pb-3 tw-pt-7 sm:tw-gap-y-3 sm:tw-pb-4 sm:tw-pt-9">
              {identityDisplay ? (
                <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-gap-y-1">
                  {identityDisplay.profileUser ? (
                    <UserProfileTooltipWrapper
                      user={identityDisplay.profileUser}
                    >
                      <Link
                        href={getIdentityHref(identityDisplay.profileUser)}
                        onClick={(e) => e.stopPropagation()}
                        className={`tw-relative tw-flex tw-min-h-6 tw-min-w-0 tw-max-w-full tw-items-center tw-justify-center tw-gap-1 tw-rounded-md tw-text-center tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-min-h-8 ${hoverTextColorClass} tw-group/link`}
                      >
                        <span
                          title={primaryLabel}
                          className={`${styles.authorFontSize} tw-block tw-min-w-0 tw-max-w-full tw-truncate tw-font-semibold tw-leading-tight tw-text-iron-100 ${hoverTextColorClass} tw-transition-colors`}
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
                          className={`tw-hidden tw-size-3 tw-opacity-0 tw-transition-opacity sm:tw-block ${styles.textColor} tw-flex-shrink-0 group-focus-visible/link:tw-opacity-100 desktop-hover:group-hover/link:tw-opacity-100 touch-only:tw-opacity-100`}
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
                      className={`${styles.authorFontSize} tw-block tw-min-w-0 tw-max-w-full tw-truncate tw-text-center tw-font-semibold tw-leading-tight tw-text-iron-100`}
                    >
                      {primaryLabel}
                    </span>
                  )}

                  <div className="tw-flex tw-max-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-x-1 tw-gap-y-1 tw-text-xs tw-text-iron-500">
                    {isSelfNominated ? (
                      <span className="tw-font-normal tw-text-iron-400 [overflow-wrap:anywhere]">
                        {t(locale, "waves.leaderboard.podium.selfNominated")}
                      </span>
                    ) : (
                      tRich(locale, "waves.leaderboard.podium.nominatedBy", {
                        nominator: (
                          <UserProfileTooltipWrapper
                            key="nominator"
                            user={authorTooltipUser}
                          >
                            <Link
                              href={authorProfileHref}
                              onClick={(e) => e.stopPropagation()}
                              className="tw-inline-flex tw-min-h-6 tw-min-w-0 tw-max-w-full tw-items-center tw-rounded-md tw-text-center tw-text-iron-300 tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-200 sm:tw-min-h-8"
                            >
                              <span
                                title={authorProfileLabel}
                                className="tw-block tw-min-w-0 tw-max-w-full tw-truncate tw-text-xs tw-font-medium tw-text-iron-400 tw-transition-colors desktop-hover:hover:tw-text-iron-200"
                              >
                                {authorProfileLabel}
                              </span>
                            </Link>
                          </UserProfileTooltipWrapper>
                        ),
                      })
                    )}
                  </div>
                </div>
              ) : (
                <UserProfileTooltipWrapper user={authorTooltipUser}>
                  <Link
                    href={authorProfileHref}
                    onClick={(e) => e.stopPropagation()}
                    className={`tw-relative tw-flex tw-min-h-6 tw-min-w-0 tw-max-w-full tw-items-center tw-justify-center tw-gap-1 tw-rounded-md tw-text-center tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-min-h-8 ${hoverTextColorClass} tw-group/link`}
                  >
                    <span
                      title={authorProfileLabel}
                      className={`${styles.authorFontSize} tw-block tw-min-w-0 tw-max-w-full tw-truncate tw-text-center tw-font-semibold tw-leading-tight tw-text-iron-200 ${hoverTextColorClass} tw-transition-colors`}
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
                      className={`tw-hidden tw-size-3 tw-opacity-0 tw-transition-opacity sm:tw-block ${styles.textColor} tw-flex-shrink-0 group-focus-visible/link:tw-opacity-100 desktop-hover:group-hover/link:tw-opacity-100 touch-only:tw-opacity-100`}
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

              <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-wrap tw-items-baseline tw-justify-center tw-gap-x-1 tw-text-center sm:tw-gap-x-1.5">
                <span
                  className={`${
                    drop.rating >= 0 ? styles.textColor : "tw-text-error"
                  } tw-min-w-0 tw-max-w-full tw-text-sm tw-font-semibold tw-tabular-nums tw-tracking-tight [overflow-wrap:anywhere] sm:tw-text-lg`}
                >
                  {formatInteger(locale, drop.rating)}
                </span>
                <span className="tw-text-[9px] tw-font-medium tw-uppercase tw-text-iron-500 sm:tw-text-xs">
                  {WAVE_VOTING_LABELS[drop.wave.voting_credit_type]}
                </span>
              </div>
            </div>

            <div className="tw-relative tw-flex tw-w-full tw-min-w-0 tw-items-center tw-justify-center">
              <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-justify-center tw-gap-1 @[42rem]/podium:tw-flex-row @[42rem]/podium:tw-gap-1.5">
                {showVoteDetails ? (
                  <ParticipationDropVoteDetailsTrigger
                    drop={drop}
                    density="podium"
                  />
                ) : (
                  <div className="tw-flex tw-min-h-7 tw-max-w-full tw-items-center tw-text-center tw-text-[11px] tw-text-iron-400 [overflow-wrap:anywhere] sm:tw-min-h-8 sm:tw-text-xs">
                    {tRich(locale, voterMessageKey, {
                      count: (
                        <span key="count" className="tw-text-iron-200">
                          {formatInteger(locale, drop.raters_count)}
                        </span>
                      ),
                    })}
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
    </motion.div>
  );
};
