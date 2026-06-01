"use client";

import React, { useMemo } from "react";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import WaveDropPartContentMedias from "./WaveDropPartContentMedias";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import type { ReferencedNft } from "@/entities/IDrop";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import WaveDropPartContentMarkdown from "./WaveDropPartContentMarkdown";
import WaveDropPartContentAttachments from "./WaveDropPartContentAttachments";
import { ImageScale } from "@/helpers/image.helpers";
import type { DropContentPresentation } from "./dropContentPresentation";
import { DropImageGalleryProvider } from "@/components/drops/view/part/DropImageGalleryProvider";
import { buildDropImageGalleryItems } from "@/components/drops/view/part/dropImageGallery";
import {
  getQuorumProposalCompactBodyGalleryKeyPrefix,
  getQuorumProposalCompactSectionKey,
  QUORUM_PROPOSAL_COMPACT_SUMMARY_KEY,
} from "@/components/waves/quorum/QuorumProposalCompactContent";
import { parseQuorumProposalMarkdown } from "@/components/waves/quorum/quorumProposalMarkdown";

interface WaveDropPartContentProps {
  readonly mentionedUsers: ApiDropMentionedUser[];
  readonly mentionedGroups?: ApiDropGroupMention[] | undefined;
  readonly mentionedWaves: ApiMentionedWave[];
  readonly referencedNfts: ReferencedNft[];
  readonly wave: ApiWaveMin;
  readonly activePart: ApiDropPart;
  readonly havePreviousPart: boolean;
  readonly haveNextPart: boolean;
  readonly isStorm: boolean;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly isEditing?: boolean | undefined;
  readonly isSaving?: boolean | undefined;
  readonly onSave?:
    | ((
        newContent: string,
        mentions?: ApiDropMentionedUser[],
        mentionedGroups?: ApiDropGroupMention[],
        mentionedWaves?: ApiMentionedWave[]
      ) => void)
    | undefined;
  readonly onCancel?: (() => void) | undefined;
  readonly drop?: ApiDrop | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly mediaImageScale?: ImageScale | undefined;
  readonly mediaContainerHeightClassName?: string | undefined;
  readonly fullWidthMedia?: boolean | undefined;
  readonly fullWidthLinkPreviews?: boolean | undefined;
  readonly onLinkCardActionsActiveChange?:
    | ((href: string, active: boolean) => void)
    | undefined;
  readonly contentPresentation?: DropContentPresentation | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
}

interface RenderedBodyMarkdown {
  readonly content: string | null;
  readonly bodyGalleryKeyPrefix?: string | undefined;
}

const WaveDropPartContent: React.FC<WaveDropPartContentProps> = ({
  mentionedUsers,
  mentionedGroups = [],
  mentionedWaves,
  referencedNfts,
  wave,
  activePart,
  havePreviousPart,
  haveNextPart,
  isStorm,
  activePartIndex,
  setActivePartIndex,
  onQuoteClick,
  isEditing = false,
  isSaving = false,
  onSave,
  onCancel,
  drop,
  isCompetitionDrop = false,
  mediaImageScale = ImageScale.AUTOx450,
  mediaContainerHeightClassName,
  fullWidthMedia = false,
  fullWidthLinkPreviews = false,
  onLinkCardActionsActiveChange,
  contentPresentation = "default",
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [quorumCompactDetailsVisible, setQuorumCompactDetailsVisible] =
    React.useState(false);
  const [quorumCompactOpenSectionKeys, setQuorumCompactOpenSectionKeys] =
    React.useState<readonly string[]>([]);
  const compactProposal = useMemo(
    () =>
      contentPresentation === "quorumCompact" && !isEditing
        ? parseQuorumProposalMarkdown(activePart.content)
        : null,
    [activePart.content, contentPresentation, isEditing]
  );

  React.useEffect(() => {
    setQuorumCompactDetailsVisible(false);
    setQuorumCompactOpenSectionKeys([]);
  }, [activePart.content, contentPresentation, isEditing]);

  const handleQuorumCompactDetailsVisibleChange = React.useCallback(
    (areDetailsVisible: boolean) => {
      setQuorumCompactDetailsVisible(areDetailsVisible);

      if (!areDetailsVisible) {
        setQuorumCompactOpenSectionKeys([]);
      }
    },
    []
  );
  const handleQuorumCompactSectionOpenChange = React.useCallback(
    (sectionKey: string, isOpen: boolean) => {
      setQuorumCompactOpenSectionKeys((currentKeys) => {
        if (isOpen) {
          return currentKeys.includes(sectionKey)
            ? currentKeys
            : [...currentKeys, sectionKey];
        }

        return currentKeys.filter((key) => key !== sectionKey);
      });
    },
    []
  );
  const renderedBodyMarkdowns = useMemo<readonly RenderedBodyMarkdown[]>(() => {
    if (isEditing) {
      return [];
    }

    if (contentPresentation !== "quorumCompact" || !compactProposal) {
      return [{ content: activePart.content }];
    }

    const bodyMarkdowns: RenderedBodyMarkdown[] = [
      {
        content: compactProposal.summaryMarkdown,
        bodyGalleryKeyPrefix: getQuorumProposalCompactBodyGalleryKeyPrefix(
          QUORUM_PROPOSAL_COMPACT_SUMMARY_KEY
        ),
      },
    ];

    if (!quorumCompactDetailsVisible) {
      return bodyMarkdowns;
    }

    const openSectionKeySet = new Set(quorumCompactOpenSectionKeys);
    compactProposal.sections.forEach((section, index) => {
      const sectionKey = getQuorumProposalCompactSectionKey(section, index);

      if (openSectionKeySet.has(sectionKey)) {
        bodyMarkdowns.push({
          content: section.markdown,
          bodyGalleryKeyPrefix:
            getQuorumProposalCompactBodyGalleryKeyPrefix(sectionKey),
        });
      }
    });

    return bodyMarkdowns;
  }, [
    activePart.content,
    compactProposal,
    contentPresentation,
    isEditing,
    quorumCompactDetailsVisible,
    quorumCompactOpenSectionKeys,
  ]);
  const galleryPartMedias = useMemo(
    () =>
      activePart.media.map((media) => ({
        mimeType: media.mime_type,
        mediaSrc: media.url,
      })),
    [activePart.media]
  );
  const galleryItems = useMemo(
    () =>
      buildDropImageGalleryItems({
        bodyMarkdowns: renderedBodyMarkdowns,
        partContent: activePart.content,
        partMedias: galleryPartMedias,
      }),
    [activePart.content, galleryPartMedias, renderedBodyMarkdowns]
  );

  const memoizedMentionedUsers = useMemo(
    () => mentionedUsers,
    [mentionedUsers]
  );
  const memoizedMentionedWaves = useMemo(
    () => mentionedWaves,
    [mentionedWaves]
  );
  const memoizedMentionedGroups = useMemo(
    () => mentionedGroups,
    [mentionedGroups]
  );
  const memoizedReferencedNfts = useMemo(
    () => referencedNfts,
    [referencedNfts]
  );

  const renderNavigationButton = (direction: "previous" | "next") => {
    const isPrevious = direction === "previous";
    const isDisabled = isPrevious ? !havePreviousPart : !haveNextPart;
    const onClick = () =>
      setActivePartIndex(activePartIndex + (isPrevious ? -1 : 1));

    return (
      <button
        disabled={isDisabled}
        className={`${
          isDisabled
            ? "tw-cursor-default tw-border-iron-700 tw-text-iron-700"
            : "tw-border-primary-400 tw-text-primary-400 hover:tw-bg-primary-400 hover:tw-text-white"
        } tw-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-bg-transparent tw-transition tw-duration-300 tw-ease-out sm:tw-size-6`}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        aria-label={`${isPrevious ? "Previous" : "Next"} part`}
      >
        <svg
          className="tw-size-5 tw-flex-shrink-0 sm:tw-size-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={
              isPrevious
                ? "M15.75 19.5 8.25 12l7.5-7.5"
                : "m8.25 4.5 7.5 7.5-7.5 7.5"
            }
          />
        </svg>
      </button>
    );
  };

  return (
    <div className="tw-w-full">
      <div className="tw-flex tw-w-full tw-flex-col tw-justify-between md:tw-flex-row md:tw-gap-x-3">
        {isStorm && (
          <div className="tw-mb-3 tw-flex tw-justify-between tw-space-x-3 md:tw-hidden">
            {renderNavigationButton("previous")}
            {renderNavigationButton("next")}
          </div>
        )}

        {isStorm && (
          <div className="tw-hidden md:tw-block">
            {renderNavigationButton("previous")}
          </div>
        )}

        <DropImageGalleryProvider items={galleryItems}>
          <div className="tw-h-full tw-w-full" ref={contentRef}>
            <div>
              <WaveDropPartContentMarkdown
                mentionedUsers={memoizedMentionedUsers}
                mentionedGroups={memoizedMentionedGroups}
                mentionedWaves={memoizedMentionedWaves}
                referencedNfts={memoizedReferencedNfts}
                part={activePart}
                wave={wave}
                onQuoteClick={onQuoteClick}
                isEditing={isEditing}
                isSaving={isSaving}
                onSave={onSave}
                onCancel={onCancel}
                drop={drop}
                onLinkCardActionsActiveChange={onLinkCardActionsActiveChange}
                contentPresentation={contentPresentation}
                embedPath={embedPath}
                quotePath={quotePath}
                embedDepth={embedDepth}
                maxEmbedDepth={maxEmbedDepth}
                fullWidthLinkPreviews={fullWidthLinkPreviews}
                quorumCompactDetailsVisible={quorumCompactDetailsVisible}
                onQuorumCompactDetailsVisibleChange={
                  handleQuorumCompactDetailsVisibleChange
                }
                quorumCompactOpenSectionKeys={quorumCompactOpenSectionKeys}
                onQuorumCompactSectionOpenChange={
                  handleQuorumCompactSectionOpenChange
                }
              />
            </div>
            {!!activePart.media.length && (
              <WaveDropPartContentMedias
                activePart={activePart}
                isCompetitionDrop={isCompetitionDrop}
                imageScale={mediaImageScale}
                mediaContainerHeightClassName={mediaContainerHeightClassName}
                fullWidthMedia={fullWidthMedia}
              />
            )}
            <WaveDropPartContentAttachments
              attachments={activePart.attachments ?? []}
            />
          </div>
        </DropImageGalleryProvider>

        {isStorm && (
          <div className="tw-hidden md:tw-block">
            {renderNavigationButton("next")}
          </div>
        )}
      </div>
    </div>
  );
};

export default WaveDropPartContent;
