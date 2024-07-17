import { Drop } from "../../../../../generated/models/Drop";
import DropPart from "../../part/DropPart";
import { useEffect, useRef, useState } from "react";
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
  const partsCount = drop.parts.length;
  const isStorm = partsCount > 1;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullMode, setIsFullMode] = useState(showFull);
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const [activePart, setActivePart] = useState(drop.parts[activePartIndex]);
  useEffect(
    () => setActivePart(drop.parts[activePartIndex]),
    [activePartIndex]
  );

  const getShowNextButton = () => {
    if (!isStorm) {
      return false;
    }
    if (activePartIndex === partsCount - 1) {
      return false;
    }
    return true;
  };

  const getShowPrevButton = () => {
    if (!isStorm) {
      return false;
    }
    if (activePartIndex === 0) {
      return false;
    }
    return true;
  };

  const [partChangedAtLeastOnce, setPartChangedAtLeastOnce] = useState(false);

  useEffect(() => setPartChangedAtLeastOnce(false), []);

  const [showNextButton, setShowNextButton] = useState(getShowNextButton());
  const [showPrevButton, setShowPrevButton] = useState(getShowPrevButton());

  useEffect(() => {
    setShowNextButton(getShowNextButton());
    setShowPrevButton(getShowPrevButton());
  }, [activePartIndex]);

  const scrollIntoView = () => {
    if (!partChangedAtLeastOnce) {
      return;
    }
    const container = containerRef.current;

    if (container) {
      const rect = container.getBoundingClientRect();

      // Check if the top of the container is out of view
      if (rect.top < 0) {
        container.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "center",
        });
      }
    }
  };

  const onPartIndex = (index: number) => {
    setActivePartIndex(index);
    setPartChangedAtLeastOnce(true);
  };

  const onNextPart = () => {
    if (activePartIndex < partsCount - 1) {
      onPartIndex(activePartIndex + 1);
    }
  };

  const onPrevPart = () => {
    if (activePartIndex > 0) {
      onPartIndex(activePartIndex - 1);
    }
  };

  return (
    <CommonAnimationHeight onAnimationCompleted={scrollIntoView}>
      <div className="tw-space-y-6 tw-h-full" ref={containerRef}>
        <DropPartWrapper
          dropPart={activePart}
          drop={drop}
          voteState={voteState}
          canVote={canVote}
          availableCredit={availableCredit}
          onQuote={onQuote}
        >
          <DropPart
            profile={drop.author}
            mentionedUsers={drop.mentioned_users}
            referencedNfts={drop.referenced_nfts}
            partContent={activePart.content ?? null}
            isStorm={isStorm}
            partMedia={
              activePart.media.length
                ? {
                    mimeType: activePart.media[0].mime_type,
                    mediaSrc: activePart.media[0].url,
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
            dropTitle={drop.title}
            showNextButton={showNextButton}
            showPrevButton={showPrevButton}
            onNextPart={onNextPart}
            onPrevPart={onPrevPart}
          />
        </DropPartWrapper>
      </div>
    </CommonAnimationHeight>
  );
}
