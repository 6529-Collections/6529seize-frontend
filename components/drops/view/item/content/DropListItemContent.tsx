import { Drop } from "../../../../../generated/models/Drop";
import DropPart from "../../part/DropPart";
import { useEffect, useState } from "react";
import CommonAnimationHeight from "../../../../utils/animation/CommonAnimationHeight";
import DropPartWrapper from "../../part/DropPartWrapper";
import { DropVoteState } from "../DropsListItem";

export enum DropContentPartType {
  MENTION = "MENTION",
  HASHTAG = "HASHTAG",
}

interface DropListItemContentProps {
  readonly drop: Drop;
  readonly showFull?: boolean;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
  readonly availableCredit: number | null;
  readonly showWaveInfo?: boolean;
  readonly onQuote: (dropPartId: number | null) => void;
}

export default function DropListItemContent({
  drop,
  showFull = false,
  voteState,
  canVote,
  availableCredit,
  showWaveInfo = true,
  onQuote,
}: DropListItemContentProps) {
  const [isFullMode, setIsFullMode] = useState(showFull);
  const getParts = () => {
    if (!drop.parts.length) {
      return [];
    }
    if (!isFullMode) {
      return [drop.parts[0]];
    }
    return drop.parts;
  };
  const [parts, setParts] = useState(getParts());
  useEffect(() => setParts(getParts()), [drop.parts, isFullMode]);

  const partsCount = drop.parts.length;
  const isStorm = partsCount > 1;

  const getShowStormExpandButton = () => {
    if (!isStorm) {
      return false;
    }
    if (isFullMode) {
      return false;
    }
    return true;
  };
  const [showStormExpandButton, setShowStormExpandButton] = useState(
    getShowStormExpandButton()
  );
  useEffect(
    () => setShowStormExpandButton(getShowStormExpandButton()),
    [isStorm, isFullMode]
  );

  return (
    <CommonAnimationHeight>
      <div className="tw-space-y-6 tw-h-full">
        {parts.map((part, index) => (
          <DropPartWrapper
            key={`drop-${drop.id}-part-${index}`}
            isFirstPart={index === 0}
            isLastPart={index === parts.length - 1}
            dropPart={part}
            drop={drop}
            voteState={voteState}
            canVote={canVote}
            showFull={isFullMode}
            availableCredit={availableCredit}
            onQuote={onQuote}
          >
            <>
              <DropPart
                profile={drop.author}
                mentionedUsers={drop.mentioned_users}
                referencedNfts={drop.referenced_nfts}
                partContent={part.content ?? null}
                partMedia={
                  part.media.length
                    ? {
                        mimeType: part.media[0].mime_type,
                        mediaSrc: part.media[0].url,
                      }
                    : null
                }
                showFull={isFullMode}
                wave={
                  showWaveInfo
                    ? {
                        name: drop.wave.name,
                        image: drop.wave.picture,
                        id: drop.wave.id,
                      }
                    : null
                }
                createdAt={drop.created_at}
                isFirstPart={index === 0}
                dropTitle={drop.title}
              />
              {showStormExpandButton && index === 0 && (
                <button
                  type="button"
                  className="sm:tw-ml-[3.25rem] tw-mt-2 tw-relative tw-shadow tw-text-xs tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-900 tw-px-2 tw-py-1.5 tw-text-iron-300 hover:tw-text-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-primary-400 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
                  onClick={() => setIsFullMode(true)}
                >
                  <svg
                    className="tw-flex-shrink-0 tw-w-4 tw-h-4 tw-mr-1.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 4H3M20 8L6 8M18 12L9 12M15 16L8 16M17 20H12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Show Storm</span>
                  <span className="tw-bg-iron-700 tw-rounded-full tw-px-1 tw-text-xs tw-ml-1">
                    {partsCount}
                  </span>
                </button>
              )}
            </>
          </DropPartWrapper>
        ))}
      </div>
    </CommonAnimationHeight>
  );
}
