import { DropPart } from "../../../../generated/models/DropPart";
import DropPartDiscussion from "./actions/discussion/DropPartDiscussion";
import DropPartActionTriggers from "./actions/DropPartActionTriggers";
import { useState } from "react";
import { Drop } from "../../../../generated/models/Drop";
import DropPartQuote from "./quote/DropPartQuote";
import { QuotedDrop } from "../../../../generated/models/QuotedDrop";
import { DropVoteState } from "../item/DropsListItem";
import DropListItemData from "../item/data/DropListItemData";
import { useRouter } from "next/router";

export interface DropPartWrapperProps {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
  readonly availableCredit: number | null;
  readonly onQuote: (dropPartId: number | null) => void;
  readonly children: React.ReactNode;
}

export default function DropPartWrapper({
  drop,
  dropPart,
  voteState,
  canVote,
  availableCredit,
  onQuote,
  children,
}: DropPartWrapperProps) {
  const router = useRouter();
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const quotedDrop: QuotedDrop | null = dropPart.quoted_drop ?? null;

  const setQuoteDrop = (dropPartId: number) => {
    setIsDiscussionOpen(false);
    onQuote(dropPartId);
  };

  const onDiscussionOpen = (state: boolean) => {
    setIsDiscussionOpen(state);
    onQuote(null);
  };

  const haveData = !!drop.mentioned_users.length || !!drop.metadata.length;

  const onDropClick = ({
    waveId,
    dropId,
  }: {
    readonly waveId: string;
    readonly dropId: string;
  }) => {
    router.push(`/waves/${waveId}?drop=${dropId}`, undefined, {
      shallow: true,
    });
  };
  return (
    <div>
      <div
        className="tw-flex tw-w-full tw-h-full tw-cursor-pointer"
        onClick={() => onDropClick({ waveId: drop.wave.id, dropId: drop.id })}
      >
        <div className="tw-flex tw-flex-col tw-justify-between tw-h-full tw-w-full tw-relative">
          <div className="tw-flex-1 tw-px-4 tw-relative tw-z-20">
            {children}
            <div>
              {quotedDrop && (
                <div
                  className="tw-cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDropClick({
                      waveId: drop.wave.id,
                      dropId: quotedDrop.drop_id,
                    });
                  }}
                >
                  <DropPartQuote quotedDrop={quotedDrop} />
                </div>
              )}
            </div>
          </div>
          <div className="tw-relative tw-z-10">
            {haveData && <DropListItemData drop={drop} />}
          </div>
          <div className="tw-px-4 tw-mt-2 tw-pb-2 tw-relative tw-z-10">
            <DropPartActionTriggers
              drop={drop}
              dropPart={dropPart}
              isDiscussionOpen={isDiscussionOpen}
              voteState={voteState}
              canVote={canVote}
              availableCredit={availableCredit ?? 0}
              setIsDiscussionOpen={onDiscussionOpen}
              onQuote={setQuoteDrop}
            />
          </div>
        </div>
      </div>
      {isDiscussionOpen && (
        <DropPartDiscussion dropPart={dropPart} drop={drop} />
      )}
    </div>
  );
}
