import { Drop } from "../../../../../generated/models/Drop";
import DropPart from "../../part/DropPart";
import { useContext, useEffect, useRef, useState } from "react";
import CommonAnimationHeight from "../../../../utils/animation/CommonAnimationHeight";
import DropPartWrapper from "../../part/DropPartWrapper";
import { DropVoteState } from "../DropsListItem";
import DropListItemFollowAuthor from "../DropListItemFollowAuthor";
import { AuthContext } from "../../../../auth/Auth";
import { useRouter } from "next/router";

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
  readonly smallMenuIsShown: boolean;
  readonly onQuote: (dropPartId: number | null) => void;
}

export default function DropListItemContent({
  drop,
  showFull = false,
  voteState,
  canVote,
  availableCredit,
  showWaveInfo = true,
  smallMenuIsShown,
  onQuote,
}: DropListItemContentProps) {
  const router = useRouter();
  const partsCount = drop.parts.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const [activePart, setActivePart] = useState(drop.parts[activePartIndex]);
  useEffect(
    () => setActivePart(drop.parts[activePartIndex]),
    [activePartIndex]
  );
  useEffect(() => setActivePart(drop.parts[activePartIndex]), [drop]);
  const [partChangedAtLeastOnce, setPartChangedAtLeastOnce] = useState(false);
  useEffect(() => setPartChangedAtLeastOnce(false), []);
  const scrollIntoView = () => {
    if (!partChangedAtLeastOnce) {
      return;
    }
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
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

  const onContentClick = () => {
    router.push(`/waves/${drop.wave.id}?drop=${drop.id}`, undefined, {
      shallow: true,
    });
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
          onContentClick={onContentClick}
        >
          <DropPart
            profile={drop.author}
            mentionedUsers={drop.mentioned_users}
            referencedNfts={drop.referenced_nfts}
            partContent={activePart.content ?? null}
            totalPartsCount={partsCount}
            smallMenuIsShown={smallMenuIsShown}
            partMedia={
              activePart.media.length
                ? {
                    mimeType: activePart.media[0].mime_type,
                    mediaSrc: activePart.media[0].url,
                  }
                : null
            }
            showFull={showFull}
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
            currentPartCount={activePartIndex + 1}
            onNextPart={onNextPart}
            onPrevPart={onPrevPart}
            onContentClick={onContentClick}
            components={{
              authorFollow:
                connectedProfile?.profile?.handle &&
                connectedProfile.profile.handle !== drop.author.handle &&
                !activeProfileProxy ? (
                  <DropListItemFollowAuthor drop={drop} />
                ) : undefined,
            }}
          />
        </DropPartWrapper>
      </div>
    </CommonAnimationHeight>
  );
}
