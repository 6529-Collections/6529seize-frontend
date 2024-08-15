import { DropPart } from "../../../../../../generated/models/DropPart";
import { Drop } from "../../../../../../generated/models/Drop";
import DropPartDiscussionItems from "./items/DropPartDiscussionItems";

export default function DropPartDiscussion({
  drop,
  dropPart,
  availableCredit,
  dropReplyDepth,
  setRepliesOpen,
}: {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly availableCredit: number | null;
  readonly dropReplyDepth: number;
  readonly setRepliesOpen: (state: boolean) => void;
}) {
  const showBorder = dropReplyDepth === 0
  return (
    <div className={`${showBorder && "tw-mt-2 tw-border-t tw-border-solid tw-border-b-0 tw-border-x-0 tw-border-iron-700"}`}>
      <DropPartDiscussionItems
        drop={drop}
        dropPart={dropPart}
        availableCredit={availableCredit}
        dropReplyDepth={dropReplyDepth}
        setRepliesOpen={setRepliesOpen}
      />
    </div>
  );
}
