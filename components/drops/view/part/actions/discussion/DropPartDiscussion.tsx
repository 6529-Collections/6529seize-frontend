import { DropPart } from "../../../../../../generated/models/DropPart";
import { Drop } from "../../../../../../generated/models/Drop";
import DropPartDiscussionItems from "./items/DropPartDiscussionItems";

export default function DropPartDiscussion({
  drop,
  dropPart,
  availableCredit,
  dropReplyDepth,
}: {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly availableCredit: number | null;
  readonly dropReplyDepth: number;
}) {
  return (
    <DropPartDiscussionItems
      drop={drop}
      dropPart={dropPart}
      availableCredit={availableCredit}
      dropReplyDepth={dropReplyDepth}
    />
  );
}
