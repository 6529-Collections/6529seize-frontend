import { DropPart } from "../../../../../../generated/models/DropPart";
import { Drop } from "../../../../../../generated/models/Drop";
import DropPartDiscussionItems from "./items/DropPartDiscussionItems";
import DropReplyInputWrapper from "../../../item/replies/input/DropReplyInputWrapper";

export default function DropPartDiscussion({
  drop,
  dropPart,
  availableCredit,
  closeReplies,
}: {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly availableCredit: number | null;
  readonly closeReplies: () => void;
}) {
  return (
    <div className="tw-pb-2">
      <DropReplyInputWrapper
        drop={drop}
        dropPart={dropPart}
        onReply={closeReplies}
      />
        <DropPartDiscussionItems
          drop={drop}
          dropPart={dropPart}
          availableCredit={availableCredit}
        />
    </div>
  );
}
