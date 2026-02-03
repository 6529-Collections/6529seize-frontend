"use client";

import React, { useMemo } from "react";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import WaveDropPartContentMedias from "./WaveDropPartContentMedias";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import type { ReferencedNft } from "@/entities/IDrop";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import WaveDropPartContentMarkdown from "./WaveDropPartContentMarkdown";
import { ImageScale } from "@/helpers/image.helpers";

interface WaveDropPartContentProps {
  readonly mentionedUsers: ApiDropMentionedUser[];
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
        mentionedWaves?: ApiMentionedWave[]
      ) => void)
    | undefined;
  readonly onCancel?: (() => void) | undefined;
  readonly drop?: ApiDrop | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly mediaImageScale?: ImageScale | undefined;
}

const WaveDropPartContent: React.FC<WaveDropPartContentProps> = ({
  mentionedUsers,
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
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  const memoizedMentionedUsers = useMemo(
    () => mentionedUsers,
    [mentionedUsers]
  );
  const memoizedMentionedWaves = useMemo(
    () => mentionedWaves,
    [mentionedWaves]
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

        <div className="tw-h-full tw-w-full" ref={contentRef}>
          <div>
            <WaveDropPartContentMarkdown
              mentionedUsers={memoizedMentionedUsers}
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
            />
          </div>
          {!!activePart.media.length && (
            <WaveDropPartContentMedias
              activePart={activePart}
              isCompetitionDrop={isCompetitionDrop}
              imageScale={mediaImageScale}
            />
          )}
        </div>

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
