import { DropPart } from "../../../../../../generated/models/DropPart";
import DropPartDiscussionInputWrapper from "./input/DropPartDiscussionInputWrapper";
import { Drop } from "../../../../../../generated/models/Drop";
import DropPartDiscussionItems from "./items/DropPartDiscussionItems";

export default function DropPartDiscussion({
  drop,
  dropPart,
}: {
  readonly drop: Drop;
  readonly dropPart: DropPart;
}) {
  return (
    <div className="tw-mt-2 tw-pt-4 tw-px-4 tw-border-t tw-border-x-0 tw-border-b-0 tw-border-iron-700 tw-border-solid">
      <DropPartDiscussionInputWrapper drop={drop} dropPart={dropPart} />
      <DropPartDiscussionItems drop={drop} dropPart={dropPart} />
    </div>
  );
}
