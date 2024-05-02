import { DropPart } from "../../../../generated/models/DropPart";
import DropPartDiscussion from "./actions/discussion/DropPartDiscussion";

import DropPartActionTriggers from "./actions/DropPartActionTriggers";
import { useState } from "react";
import DropPartDiscussionWrapper from "./actions/discussion/DropPartDiscussionWrapper";
import { Drop } from "../../../../generated/models/Drop";
import DropPartQuote from "./quote/DropPartQuote";
import { QuotedDrop } from "../../../../generated/models/QuotedDrop";

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
    <div>
      <div className="tw-border-2 tw-border-solid tw-border-blue-600">
        {children}
        {quotedDrop && <DropPartQuote quotedDrop={quotedDrop} />}
      </div>
      <DropPartActionTriggers
        dropPart={dropPart}
        isDiscussionOpen={isDiscussionOpen}
        setIsDiscussionOpen={setIsDiscussionOpen}
        onQuote={onQuote}
      />
      <DropPartDiscussionWrapper
        dropPart={dropPart}
        isDiscussionOpen={isDiscussionOpen}
      >
        <DropPartDiscussion dropPart={dropPart} drop={drop} />
      </DropPartDiscussionWrapper>
    </div>
  );
}
