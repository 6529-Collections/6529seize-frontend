import { DropPart } from "../../../../../../generated/models/DropPart";
import { Drop } from "../../../../../../generated/models/Drop";
import DropPartDiscussionItems from "./items/DropPartDiscussionItems";
import DropReplyInputWrapper from "../../../item/replies/input/DropReplyInputWrapper";

export default function DropPartDiscussion({
  drop,
  dropPart,
  availableCredit,
  dropReplyDepth,
  closeReplies,
}: {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly availableCredit: number | null;
  readonly dropReplyDepth: number;
  readonly closeReplies: () => void;
}) {
  const intent = dropReplyDepth > 0;
  console.log(dropReplyDepth)
  return (
    <div className={`${intent && "tw-pl-12"} tw-pb-2`}>
      <DropReplyInputWrapper
        drop={drop}
        dropPart={dropPart}
        onReply={closeReplies}
      />
      <DropPartDiscussionItems
        drop={drop}
        dropPart={dropPart}
        availableCredit={availableCredit}
        dropReplyDepth={dropReplyDepth}
      />
    </div>
  );
}
