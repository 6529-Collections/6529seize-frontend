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
      <div className="tw-space-y-2 ">
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
              <button onClick={() => setIsFullMode(true)}>
                Show storm ({partsCount})
              </button>
            )}
          </DropPartWrapper>
        ))}
      </div>
    </CommonAnimationHeight>
  );
}
