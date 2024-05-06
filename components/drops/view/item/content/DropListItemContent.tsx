import { Drop } from "../../../../../generated/models/Drop";
import DropPart from "../../part/DropPart";
import { useEffect, useState } from "react";
import CommonAnimationHeight from "../../../../utils/animation/CommonAnimationHeight";
import DropPartWrapper from "../../part/DropPartWrapper";

export enum DropContentPartType {
  MENTION = "MENTION",
  HASHTAG = "HASHTAG",
}

export default function DropListItemContent({
  drop,
  showFull = false,
  onQuote,
}: {
  readonly drop: Drop;
  readonly showFull?: boolean;
  readonly onQuote: (dropPartId: number) => void;
}) {
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
      <div className="tw-space-y-2 tw-h-full">
        {parts.map((part, index) => (
          <DropPartWrapper
            key={`drop-${drop.id}-part-${index}`}
            dropPart={part}
            drop={drop}
            onQuote={onQuote}
          >
            <DropPart
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
            />
            {showStormExpandButton && index === 0 && (
              <button
                type="button"
                className="tw-relative tw-shadow tw-text-xs tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-700 tw-px-2 tw-py-1.5 tw-text-iron-200 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
                onClick={() => setIsFullMode(true)}
              >
                Show storm ({partsCount})
              </button>
            )}
          </DropPartWrapper>
        ))}
      </div>
    </CommonAnimationHeight>
  );
}
