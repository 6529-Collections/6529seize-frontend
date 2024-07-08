import { DropPart } from "../../../../generated/models/DropPart";
import DropPartDiscussion from "./actions/discussion/DropPartDiscussion";

import DropPartActionTriggers from "./actions/DropPartActionTriggers";
import { useState } from "react";
import { Drop } from "../../../../generated/models/Drop";
import DropPartQuote from "./quote/DropPartQuote";
import { QuotedDrop } from "../../../../generated/models/QuotedDrop";
import CommonAnimationHeight from "../../../utils/animation/CommonAnimationHeight";

export default function DropPartWrapper({
  drop,
  dropPart,
  onQuote,
  children,
}: {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly onQuote: (dropPartId: number) => void;
  readonly children: React.ReactNode;
}) {
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const quotedDrop: QuotedDrop | null = dropPart.quoted_drop ?? null;
  return (
    <div className="tw-flex tw-flex-col tw-justify-between tw-h-full">
      <div>
        {children}
        {quotedDrop && <DropPartQuote quotedDrop={quotedDrop} />}
      </div>
      <DropPartActionTriggers
        dropPart={dropPart}
        isDiscussionOpen={isDiscussionOpen}
        setIsDiscussionOpen={setIsDiscussionOpen}
        onQuote={onQuote}
      />
      {isDiscussionOpen && (
        <DropPartDiscussion dropPart={dropPart} drop={drop} />
      )}
    </div>
  );
}
