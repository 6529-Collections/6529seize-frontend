import { DropPart } from "../../../../../../generated/models/DropPart";
import { Drop } from "../../../../../../generated/models/Drop";
import DropPartDiscussionItems from "./items/DropPartDiscussionItems";
import DropReplyInputWrapper from "../../../item/replies/input/DropReplyInputWrapper";

export default function DropPartDiscussion({
  drop,
  dropPart,
  availableCredit,
}: {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly availableCredit: number | null;
}) {
  return (
    <div className="tw-mt-2 tw-pt-4 tw-border-t tw-border-x-0 tw-border-b-0 tw-border-iron-700 tw-border-solid">
      <DropReplyInputWrapper drop={drop} dropPart={dropPart} />
      <DropPartDiscussionItems
        drop={drop}
        dropPart={dropPart}
        availableCredit={availableCredit}
      />
    </div>
  );
}
