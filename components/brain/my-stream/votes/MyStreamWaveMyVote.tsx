import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { ApiNftLinkMediaPreviewStatusEnum } from "@/generated/models/ApiNftLinkMediaPreview";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { SingleWaveDropPosition } from "@/components/waves/drop/SingleWaveDropPosition";
import { ImageScale } from "@/helpers/image.helpers";
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

interface MyStreamWaveMyVoteProps {
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

const MyStreamWaveMyVote: React.FC<MyStreamWaveMyVoteProps> = ({
  drop,
  onDropClick,
  onExplainVote,
  isChecked = false,
  onToggleCheck,
  isResetting = false,
  isVotingClosed = false,
  winningThreshold,
}) => {
  const locale = useBrowserLocale();
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
  const isSelected = !isVotingClosed && isChecked;
  const selectionInputId = `my-vote-reset-selection-${drop.id}`;

  const handleOpenDrop = () => {
    if (window.getSelection()?.toString()) {
      return;
    }
    onDropClick(drop);
  };

  const handleRowClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (
      event.defaultPrevented ||
      !(target instanceof Element) ||
      !event.currentTarget.contains(target)
    ) {
      return;
    }

    const control = target.closest(
      "a, button, input, select, textarea, label, [role='button'], [role='link'], [role='checkbox'], [role='dialog'], [tabindex], [contenteditable='true'], [data-vote-controls]"
    );
    if (control && control !== event.currentTarget) {
      return;
    }

    handleOpenDrop();
  };

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && event.key === "Enter") {
      event.preventDefault();
      handleOpenDrop();
    }
  };

  const handleExplainVote = (voteTotal: number, voteChange: number) => {
    onExplainVote?.(drop, voteTotal, voteChange);
  };

  const handleSelectionChange = () => {
    if (isVotingClosed || isResetting) {
      return;
    }

    if (onToggleCheck) {
      onToggleCheck(drop.id);
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={t(locale, "waves.leaderboard.grid.openNamed", {
        title: dropTitle,
      })}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      className={`tw-cursor-pointer tw-px-2 tw-py-5 tw-transition-colors tw-duration-200 tw-@container/my-vote focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none sm:tw-px-4 sm:tw-py-6 ${
        isSelected
          ? "tw-bg-primary-500/10"
          : "tw-bg-transparent"
      }`}
    >
      <div
        className={`tw-grid tw-grid-cols-[28px_96px_minmax(0,1fr)] tw-gap-x-2 tw-gap-y-4 @[16rem]/my-vote:tw-grid-cols-[28px_64px_minmax(0,1fr)] @[36rem]/my-vote:tw-grid-cols-[28px_96px_minmax(0,1fr)] @[36rem]/my-vote:tw-gap-x-4 @[36rem]/my-vote:tw-gap-y-3 ${
          isVotingClosed
            ? ""
            : "@[46rem]/my-vote:tw-grid-cols-[28px_96px_minmax(0,1fr)_18rem]"
        }`}
      >
        <div className="tw-flex tw-h-24 tw-items-center tw-justify-center @[16rem]/my-vote:tw-h-16 @[36rem]/my-vote:tw-row-span-2 @[36rem]/my-vote:tw-h-24">
          {!isVotingClosed ? (
            <label
              htmlFor={selectionInputId}
              className="tw-relative tw-flex tw-size-11 tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg"
            >
              <input
                id={selectionInputId}
                type="checkbox"
                checked={isSelected}
                onChange={handleSelectionChange}
                disabled={isResetting}
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
          ) : (
            <span aria-hidden="true" className="tw-size-11" />
          )}
        </div>

        <div className="tw-relative tw-size-24 @[16rem]/my-vote:tw-size-16 @[36rem]/my-vote:tw-row-span-2 @[36rem]/my-vote:tw-size-24">
          <button
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
                />
              )}
            </span>
          </button>
        </div>

        <div className="tw-col-span-3 tw-row-start-2 tw-flex tw-min-w-0 tw-flex-col @[16rem]/my-vote:tw-col-span-1 @[16rem]/my-vote:tw-col-start-3 @[16rem]/my-vote:tw-row-start-1">
          <div className="tw-flex tw-min-w-0 tw-items-start tw-gap-2">
            <MediaTypeBadge
              mimeType={badgeMimeType}
              dropId={drop.id}
              size="xs"
              className="tw-size-6 tw-justify-center"
            />
            <h3 className="tw-m-0 tw-flex tw-min-h-6 tw-min-w-0 tw-flex-1 tw-items-center">
              <button
                type="button"
                onClick={handleOpenDrop}
                className="tw-max-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 tw-transition-colors tw-duration-200 [overflow-wrap:anywhere] focus-visible:tw-rounded-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-primary-300 motion-reduce:tw-transition-none"
              >
                {dropTitle}
              </button>
            </h3>
          </div>
          <div className="tw-mt-3 tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            <div className="tw-relative tw-size-6 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-white/10">
              {drop.author.pfp ? (
                <Image
                  src={drop.author.pfp}
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
            <UserProfileTooltipWrapper
              user={drop.author.handle ?? drop.author.id}
            >
              <Link
                href={`/${drop.author.handle ?? drop.author.primary_address}`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.open(
                    `/${drop.author.handle ?? drop.author.primary_address}`,
                    "_blank"
                  );
                }}
                className="tw-min-w-0 tw-text-sm tw-font-semibold tw-leading-5 tw-tracking-identity tw-text-white tw-no-underline tw-transition-colors tw-duration-200 [overflow-wrap:anywhere] desktop-hover:hover:tw-underline motion-reduce:tw-transition-none"
              >
                {drop.author.handle ?? drop.author.primary_address}
              </Link>
            </UserProfileTooltipWrapper>
            <UserCICAndLevel
              level={drop.author.level || 0}
              size={UserCICAndLevelSize.SMALL}
            />
          </div>
        </div>

        <div className="tw-col-span-3 tw-row-start-3 tw-flex tw-min-h-6 tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 @[16rem]/my-vote:tw-row-start-2 @[36rem]/my-vote:tw-col-span-1 @[36rem]/my-vote:tw-col-start-3 @[36rem]/my-vote:tw-self-start @[46rem]/my-vote:tw-min-h-8">
          <MyStreamWaveMyVoteVotes
            drop={drop}
            winningThreshold={winningThreshold}
          />
          <div className="tw-flex tw-items-center tw-gap-2">
            {drop.top_raters.length > 0 && (
              <div className="tw-flex tw-items-center -tw-space-x-2">
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
                      className="tw-rounded-md focus-visible:tw-relative focus-visible:tw-z-10 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                    >
                      {voter.profile.pfp ? (
                        <Image
                          className="tw-size-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
                          src={voter.profile.pfp}
                          width={24}
                          height={24}
                          unoptimized
                          alt={t(locale, "waves.myVotes.voterAvatar", {
                            profile:
                              voter.profile.handle ??
                              voter.profile.primary_address,
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
            <span className="tw-whitespace-nowrap tw-text-sm tw-leading-6 tw-text-iron-400">
              <span className="tw-font-semibold tw-text-iron-300">
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
          {typeof drop.rank === "number" && (
            <SingleWaveDropPosition
              rank={drop.rank}
              variant="simple"
              size="sm"
            />
          )}
        </div>

        {!isVotingClosed && (
          <MyStreamWaveMyVoteInput
            drop={drop}
            isResetting={isResetting}
            isVotingClosed={isVotingClosed}
            onExplainVote={onExplainVote ? handleExplainVote : undefined}
          />
        )}
      </div>
    </div>
  );
};

export default MyStreamWaveMyVote;
