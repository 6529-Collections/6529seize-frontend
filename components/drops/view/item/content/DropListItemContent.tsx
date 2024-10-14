import { ApiDrop } from "../../../../../generated/models/ApiDrop";
import DropPart, { DropPartSize } from "../../part/DropPart";
import { useContext, useEffect, useRef, useState } from "react";
import DropPartWrapper from "../../part/DropPartWrapper";
import { DropConnectingLineType, DropVoteState } from "../DropsListItem";
import DropListItemFollowAuthor from "../DropListItemFollowAuthor";
import { AuthContext } from "../../../../auth/Auth";
import { useRouter } from "next/router";
import DropListItemContentWrapper from "./DropListItemContentWrapper";

export enum DropContentPartType {
  MENTION = "MENTION",
  HASHTAG = "HASHTAG",
}

interface DropListItemContentProps {
  readonly drop: ApiDrop;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
  readonly availableCredit: number | null;
  readonly showWaveInfo?: boolean;
  readonly smallMenuIsShown: boolean;
  readonly dropReplyDepth: number;
  readonly isDiscussionOpen: boolean;
  readonly connectingLineType?: DropConnectingLineType | null;
  readonly onDiscussionButtonClick: () => void;
}

export default function DropListItemContent({
  drop,
  voteState,
  canVote,
  availableCredit,
  showWaveInfo = true,
  smallMenuIsShown,
  dropReplyDepth,
  isDiscussionOpen,
  connectingLineType = DropConnectingLineType.NONE,
  onDiscussionButtonClick,
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
    router.push(`/waves/${drop.wave.id}?drop=${drop.serial_no}`, undefined, {
      shallow: true,
    });
  };

  const size =
    dropReplyDepth > 0 && !isDiscussionOpen
      ? DropPartSize.SMALL
      : DropPartSize.MEDIUM;

  return (
    <DropListItemContentWrapper
      scrollIntoView={scrollIntoView}
      shouldWrap={dropReplyDepth === 0}
    >
      <div className="tw-space-y-6 tw-h-full" ref={containerRef}>
        <DropPartWrapper
          dropPart={activePart}
          drop={drop}
          voteState={voteState}
          canVote={canVote}
          size={size}
          availableCredit={availableCredit}
          dropReplyDepth={dropReplyDepth}
          isDiscussionOpen={isDiscussionOpen}
          connectingLineType={connectingLineType}
          showWaveInfo={showWaveInfo}
          onDiscussionButtonClick={onDiscussionButtonClick}
        >
          <DropPart
            profile={drop.author}
            size={size}
            mentionedUsers={drop.mentioned_users}
            referencedNfts={drop.referenced_nfts}
            partContent={activePart.content ?? null}
            totalPartsCount={partsCount}
            smallMenuIsShown={smallMenuIsShown}
            partMedias={activePart.media.map((media) => ({
              mimeType: media.mime_type,
              mediaSrc: media.url,
            }))}
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
    </DropListItemContentWrapper>
  );
}
