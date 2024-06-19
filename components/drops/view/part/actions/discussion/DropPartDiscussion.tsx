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
    <div className="tw-mt-4">
      <DropPartDiscussionInputWrapper drop={drop} dropPart={dropPart} />
      <DropPartDiscussionItems drop={drop} dropPart={dropPart} />
    </div>
  );
}
