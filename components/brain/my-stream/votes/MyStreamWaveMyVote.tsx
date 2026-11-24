import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { ApiNftLinkMediaPreviewStatusEnum } from "@/generated/models/ApiNftLinkMediaPreview";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { SingleWaveDropPosition } from "@/components/waves/drop/SingleWaveDropPosition";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";
import { Tooltip } from "react-tooltip";
import MyStreamWaveMyVoteInput from "./MyStreamWaveMyVoteInput";
import MyStreamWaveMyVoteVotes from "./MyStreamWaveMyVoteVotes";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  MY_VOTES_SPATIAL_TRANSITION,
  MY_VOTES_FADE_TRANSITION,
} from "./myVotesMotion";
import { useMyVoteLongPress } from "./useMyVoteLongPress";

interface MyStreamWaveMyVoteProps {
  readonly mobile?: boolean;
  readonly isSelecting?: boolean;
  readonly onEnterSelection?: (() => void) | undefined;
  readonly voteInput?: React.ReactNode;
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly onExplainVote?:
    | ((drop: ExtendedDrop, voteTotal: number, voteChange: number) => void)
    | undefined;
  readonly isChecked?: boolean | undefined;
  readonly onToggleCheck?: ((dropId: string) => void) | undefined;
  readonly isResetting?: boolean | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly winningThreshold?: number | null | undefined;
}

type ResolvedPreviewMedia = {
  readonly url: string;
  readonly mimeType: string;
};

const DEFAULT_MIME_TYPE = "image/jpeg";

const MIME_BY_EXTENSION: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: DEFAULT_MIME_TYPE,
  jpg: DEFAULT_MIME_TYPE,
  m4v: "video/x-m4v",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  ogg: "audio/ogg",
  ogv: "video/ogg",
  flac: "audio/flac",
  png: "image/png",
  svg: "image/svg+xml",
  wav: "audio/wav",
  webm: "video/webm",
  webp: "image/webp",
  glb: "model/gltf-binary",
  gltf: "model/gltf+json",
  usdz: "model/vnd.usdz",
};

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const inferMimeTypeFromUrl = (url: string): string | undefined => {
  try {
    const parsed = new URL(url);
    const extensionMatch = parsed.pathname
      .toLowerCase()
      .match(/\.([a-z0-9]+)$/);
    if (!extensionMatch?.[1]) {
      return undefined;
    }

    return MIME_BY_EXTENSION[extensionMatch[1]];
  } catch {
    const path = url.split("?")[0]?.toLowerCase() ?? "";
    const extensionMatch = path.match(/\.([a-z0-9]+)$/);
    if (!extensionMatch?.[1]) {
      return undefined;
    }

    return MIME_BY_EXTENSION[extensionMatch[1]];
  }
};

const resolveCurationPreviewMedia = (
  nftLinks: ExtendedDrop["nft_links"]
): ResolvedPreviewMedia | null => {
  if (typeof nftLinks?.length !== "number" || nftLinks.length === 0) {
    return null;
  }

  for (const nftLink of nftLinks) {
    const preview = nftLink.data?.media_preview;
    const previewMimeType = toNonEmptyString(preview?.mime_type);
    const previewUrl =
      preview?.status === ApiNftLinkMediaPreviewStatusEnum.Ready
        ? (toNonEmptyString(preview.card_url) ??
          toNonEmptyString(preview.small_url) ??
          toNonEmptyString(preview.thumb_url))
        : null;
    if (previewUrl) {
      return {
        url: previewUrl,
        mimeType:
          previewMimeType ??
          inferMimeTypeFromUrl(previewUrl) ??
          DEFAULT_MIME_TYPE,
      };
    }

    const fallbackUrl = toNonEmptyString(nftLink.data?.media_uri);
    if (!fallbackUrl) {
      continue;
    }

    return {
      url: fallbackUrl,
      mimeType:
        inferMimeTypeFromUrl(fallbackUrl) ??
        previewMimeType ??
        DEFAULT_MIME_TYPE,
    };
  }

  return null;
};

function MyVoteAuthor({
  author,
  mobile = false,
}: {
  readonly author: ExtendedDrop["author"];
  readonly mobile?: boolean;
}) {
  return (
    <div
      data-my-vote-author
      className={
        mobile
          ? "tw-mt-3 tw-flex tw-min-w-0 tw-items-start tw-gap-2"
          : "tw-mt-4 tw-flex tw-min-w-0 tw-items-center tw-gap-2"
      }
    >
      <div className="tw-relative tw-size-6 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-white/10">
        {author.pfp ? (
          <Image
            src={getScaledImageUri(author.pfp, ImageScale.W_AUTO_H_50)}
            alt=""
            width={24}
            height={24}
            unoptimized
            className="tw-h-full tw-w-full tw-bg-iron-800 tw-object-contain"
          />
        ) : (
          <div className="tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-white/10"></div>
        )}
      </div>
      <div className="tw-min-w-0">
        <UserProfileTooltipWrapper user={author.handle ?? author.id}>
          <Link
            href={`/${author.handle ?? author.primary_address}`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              globalThis.open(
                `/${author.handle ?? author.primary_address}`,
                "_blank"
              );
            }}
            title={author.handle ?? author.primary_address}
            className={`tw-block tw-truncate tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-200 tw-no-underline tw-transition-colors tw-duration-200 desktop-hover:hover:tw-underline motion-reduce:tw-transition-none ${mobile ? "tw-min-h-11 tw-pt-0.5" : ""}`}
          >
            {author.handle ?? author.primary_address}
          </Link>
        </UserProfileTooltipWrapper>
      </div>
      <UserCICAndLevel
        level={author.level || 0}
        size={UserCICAndLevelSize.SMALL}
      />
    </div>
  );
}

function MyVoteVoters({
  drop,
  mobile = false,
}: {
  readonly drop: ExtendedDrop;
  readonly mobile?: boolean;
}) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-flex tw-items-center tw-gap-2">
      {drop.top_raters.length > 0 && (
        <div
          className={`tw-flex tw-items-center ${mobile ? "" : "-tw-space-x-2"}`}
        >
          {drop.top_raters.slice(0, 3).map((voter) => (
            <React.Fragment
              key={voter.profile.id || voter.profile.primary_address}
            >
              <Link
                href={`/${voter.profile.handle ?? voter.profile.primary_address}`}
                data-tooltip-id={`my-vote-voter-${drop.id}-${voter.profile.handle ?? voter.profile.primary_address}`}
                aria-label={t(locale, "waves.myVotes.voterAvatar", {
                  profile:
                    voter.profile.handle ?? voter.profile.primary_address,
                })}
                className={`tw-rounded-md focus-visible:tw-relative focus-visible:tw-z-10 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${mobile ? "tw-flex tw-size-11 tw-items-center tw-justify-center" : ""}`}
              >
                {voter.profile.pfp ? (
                  <Image
                    className="tw-size-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
                    src={getScaledImageUri(
                      voter.profile.pfp,
                      ImageScale.W_AUTO_H_50
                    )}
                    width={24}
                    height={24}
                    unoptimized
                    alt={t(locale, "waves.myVotes.voterAvatar", {
                      profile:
                        voter.profile.handle ?? voter.profile.primary_address,
                    })}
                  />
                ) : (
                  <div className="tw-size-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800" />
                )}
              </Link>
              <Tooltip
                id={`my-vote-voter-${drop.id}-${voter.profile.handle ?? voter.profile.primary_address}`}
                place="top"
                offset={8}
                opacity={1}
                style={{
                  padding: "4px 8px",
                  background: "#37373E",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 500,
                  borderRadius: "6px",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  zIndex: 99999,
                  pointerEvents: "none",
                }}
              >
                {voter.profile.handle ?? voter.profile.primary_address} -{" "}
                {formatInteger(locale, voter.rating)}
              </Tooltip>
            </React.Fragment>
          ))}
        </div>
      )}
      <span className="tw-whitespace-nowrap tw-text-[13px] tw-font-normal tw-leading-5 tw-text-iron-300">
        <span className="tw-font-semibold">
          {formatInteger(locale, drop.raters_count)}
        </span>{" "}
        {t(
          locale,
          drop.raters_count === 1
            ? "waves.myVotes.voter.one"
            : "waves.myVotes.voter.other"
        )}
      </span>
    </div>
  );
}

const MyStreamWaveMyVote: React.FC<MyStreamWaveMyVoteProps> = ({
  mobile = false,
  isSelecting = true,
  onEnterSelection,
  drop,
  onDropClick,
  onExplainVote,
  isChecked = false,
  onToggleCheck,
  isResetting = false,
  isVotingClosed = false,
  winningThreshold,
  voteInput,
}) => {
  const locale = useBrowserLocale();
  const reduceMotion = useReducedMotion();
  const dropTitle = drop.title ?? t(locale, "waves.leaderboard.grid.untitled");
  const { isCurationWave } = useSeizeSettings();
  const artWork = drop.parts.at(0)?.media.at(0);
  const previewImageUrl = useMemo(
    () => getDropPreviewImageUrl(drop.metadata),
    [drop.metadata]
  );
  const curationPreviewMedia = useMemo(
    () =>
      !artWork && isCurationWave(drop.wave.id.toLowerCase())
        ? resolveCurationPreviewMedia(drop.nft_links)
        : null,
    [artWork, drop.nft_links, drop.wave.id, isCurationWave]
  );
  const resolvedMediaUrl = artWork?.url ?? curationPreviewMedia?.url ?? null;
  const resolvedMediaMimeType =
    artWork?.mime_type ?? curationPreviewMedia?.mimeType ?? DEFAULT_MIME_TYPE;
  const badgeMimeType = artWork?.mime_type ?? curationPreviewMedia?.mimeType;
  const isSelected = isSelecting && !isVotingClosed && isChecked;
  const isSelectionDisabled = isVotingClosed || isResetting || !onToggleCheck;
  const selectionInputId = `my-vote-reset-selection-${drop.id}`;
  const mobileSelectionWidth = isSelecting ? 44 : 0;
  const desktopGridColumns = isVotingClosed
    ? ""
    : "@[40rem]/my-vote:tw-grid-cols-[44px_96px_minmax(0,1fr)_24rem]";
  const mobileGridColumns = isVotingClosed
    ? ""
    : "@[40rem]/my-vote:tw-grid-cols-[auto_64px_minmax(0,1fr)_24rem] @[40rem]/my-vote:tw-gap-x-3";
  const titleId = `my-vote-title-${drop.id}`;
  const longPress = useMyVoteLongPress(
    mobile && !isSelecting && !isSelectionDisabled,
    () => onEnterSelection?.()
  );

  const handleOpenDrop = () => {
    if (window.getSelection()?.toString()) {
      return;
    }
    onDropClick(drop);
  };

  const handleSelectionChange = () => {
    if (isSelectionDisabled) return;
    if (!isSelecting && !mobile) onEnterSelection?.();
    else if (isSelecting) onToggleCheck(drop.id);
  };

  // Row clicks extend the native checkbox's pointer target.
  // The checkbox provides keyboard selection; other controls stay independent.
  const handleRowClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target;
    if (
      event.defaultPrevented ||
      !(target instanceof Element) ||
      !event.currentTarget.contains(target) ||
      window.getSelection()?.toString()
    ) {
      return;
    }

    // Input/label clicks already select through onChange; do not toggle twice.
    const control = target.closest(
      "a, button, input, select, textarea, label, [role='button'], [role='link'], [role='checkbox'], [role='dialog'], [tabindex], [contenteditable='true'], [data-vote-controls]"
    );
    if (
      control &&
      control !== event.currentTarget &&
      event.currentTarget.contains(control)
    ) {
      return;
    }

    if (!mobile || isSelecting) handleSelectionChange();
  };

  const handleExplainVote = (voteTotal: number, voteChange: number) => {
    onExplainVote?.(drop, voteTotal, voteChange);
  };

  const voteStats = (
    <>
      <MyStreamWaveMyVoteVotes
        drop={drop}
        winningThreshold={winningThreshold}
      />
      <MyVoteVoters drop={drop} mobile={mobile} />
      {typeof drop.rank === "number" && (
        <div className="tw-flex tw-shrink-0 tw-items-center [&_span]:!tw-text-[13px]">
          <SingleWaveDropPosition rank={drop.rank} variant="simple" size="sm" />
        </div>
      )}
    </>
  );

  return (
    <article // NOSONAR -- S1082/S6847: the native checkbox provides keyboard selection.
      aria-labelledby={titleId}
      onClick={handleRowClick}
      {...longPress}
      className={`tw-px-4 tw-py-4 tw-transition-colors tw-duration-200 tw-@container/my-vote motion-reduce:tw-transition-none ${
        isSelectionDisabled ? "" : "tw-cursor-pointer"
      } ${isSelected ? "tw-bg-primary-500/10" : "tw-bg-iron-950"} ${
        !isSelected && !isSelectionDisabled
          ? "desktop-hover:hover:tw-bg-iron-900/80"
          : ""
      }`}
    >
      <div
        className={
          mobile
            ? `tw-grid tw-grid-cols-[auto_72px_minmax(0,1fr)] tw-gap-y-2 ${mobileGridColumns}`
            : `tw-grid tw-grid-cols-[44px_96px_minmax(0,1fr)] tw-gap-x-3 tw-gap-y-2 ${desktopGridColumns}`
        }
      >
        <motion.div
          animate={{ width: mobile ? mobileSelectionWidth : 44 }}
          transition={
            reduceMotion ? { duration: 0 } : MY_VOTES_SPATIAL_TRANSITION
          }
          className={
            mobile
              ? "tw-col-start-1 tw-row-start-1 tw-overflow-hidden"
              : "tw-col-start-1 tw-row-start-1 tw-flex tw-h-24 tw-items-center tw-justify-center"
          }
        >
          <AnimatePresence initial={false}>
            {!isVotingClosed && onToggleCheck && (!mobile || isSelecting) ? (
              <motion.div
                key="checkbox"
                initial={mobile ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={MY_VOTES_FADE_TRANSITION}
              >
                <label
                  htmlFor={selectionInputId}
                  className="tw-relative tw-flex tw-size-11 tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg"
                >
                  <input
                    id={selectionInputId}
                    type="checkbox"
                    checked={isSelected}
                    onChange={handleSelectionChange}
                    disabled={isSelectionDisabled}
                    className="tw-peer tw-absolute tw-inset-0 tw-m-0 tw-cursor-pointer tw-opacity-0 disabled:tw-cursor-not-allowed"
                  />
                  <span className="tw-sr-only">
                    {t(
                      locale,
                      isSelected
                        ? "waves.myVotes.deselectForReset"
                        : "waves.myVotes.selectForReset",
                      { title: dropTitle }
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-transition-colors tw-duration-200 peer-focus-visible:tw-outline peer-focus-visible:tw-outline-2 peer-focus-visible:tw-outline-offset-2 peer-focus-visible:tw-outline-primary-400 peer-disabled:tw-opacity-50 motion-reduce:tw-transition-none ${
                      isSelected
                        ? "tw-border-primary-500 tw-bg-primary-500 tw-text-white"
                        : "tw-border-iron-500 tw-bg-transparent tw-text-transparent"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="tw-size-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </label>
              </motion.div>
            ) : (
              !mobile && <span aria-hidden="true" className="tw-size-11" />
            )}
          </AnimatePresence>
        </motion.div>

        <div
          className={
            mobile
              ? "tw-relative tw-col-start-2 tw-row-start-1 tw-size-16 [&_img]:!tw-object-cover [&_video]:!tw-object-cover"
              : "tw-relative tw-col-start-2 tw-row-start-1 tw-size-24"
          }
        >
          <button
            data-my-vote-open
            type="button"
            onClick={handleOpenDrop}
            aria-label={t(locale, "waves.leaderboard.grid.openNamed", {
              title: dropTitle,
            })}
            className={`tw-relative tw-block tw-size-full tw-overflow-hidden tw-border-0 tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${
              resolvedMediaUrl ? "tw-bg-black" : "tw-bg-iron-800"
            }`}
          >
            <span className="tw-absolute tw-inset-0 tw-z-[1] tw-block">
              {resolvedMediaUrl && (
                <MediaDisplay
                  media_mime_type={resolvedMediaMimeType}
                  media_url={resolvedMediaUrl}
                  imageScale={ImageScale.AUTOx450}
                  previewImageUrl={previewImageUrl}
                  disableMediaInteraction={true}
                  fillVideoContainer={mobile}
                />
              )}
            </span>
          </button>
          {mobile && (
            <MediaTypeBadge
              mimeType={badgeMimeType}
              dropId={drop.id}
              size="xs"
              showTooltip={false}
              className="tw-pointer-events-none tw-absolute tw-right-0 tw-top-0 tw-z-[2]"
              iconClassName="!tw-border-0 !tw-bg-transparent !tw-text-white tw-drop-shadow-md"
            />
          )}
        </div>

        {/* Reuse the card's top padding for the title's 44px touch target. */}
        <div
          className={`tw-col-start-3 tw-row-start-1 tw-flex tw-min-w-0 tw-flex-col ${mobile ? "-tw-mt-4" : ""}`}
        >
          <div className="tw-flex tw-min-w-0 tw-items-start tw-gap-2">
            {!mobile && (
              <MediaTypeBadge
                mimeType={badgeMimeType}
                dropId={drop.id}
                size="xs"
                className="tw-size-6 tw-justify-center"
              />
            )}
            <h3
              id={titleId}
              className={`tw-m-0 tw-flex tw-min-h-6 tw-min-w-0 tw-items-center ${mobile ? "tw-flex-1" : "tw-flex-initial"}`}
            >
              <button
                data-my-vote-open
                type="button"
                onClick={handleOpenDrop}
                title={dropTitle}
                className={`tw-max-w-full tw-truncate tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100 tw-transition-colors tw-duration-200 focus-visible:tw-rounded-sm focus-visible:tw-text-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-primary-400 motion-reduce:tw-transition-none ${mobile ? "tw-min-h-11 tw-pb-1 tw-pt-4" : ""}`}
              >
                {dropTitle}
              </button>
            </h3>
          </div>
          <MyVoteAuthor author={drop.author} mobile={mobile} />
          {!mobile && (
            <div className="tw-mt-2 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
              {voteStats}
            </div>
          )}
        </div>

        {mobile && (
          <div className="tw-col-span-3 tw-row-start-2 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-text-[13px]">
            {voteStats}
          </div>
        )}

        {!isVotingClosed &&
          (voteInput ?? (
            <MyStreamWaveMyVoteInput
              drop={drop}
              mobile={mobile}
              isResetting={isResetting}
              isVotingClosed={isVotingClosed}
              onExplainVote={onExplainVote ? handleExplainVote : undefined}
            />
          ))}
      </div>
    </article>
  );
};

export default MyStreamWaveMyVote;
