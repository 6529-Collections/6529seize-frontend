import { DropPart } from "../../../../../../generated/models/DropPart";
import { Drop } from "../../../../../../generated/models/Drop";
import DropPartDiscussionItems from "./items/DropPartDiscussionItems";

export default function DropPartDiscussion({
  drop,
  dropPart,
  availableCredit,
  dropReplyDepth,
  activeDiscussionDropId,
  showWaveInfo = true,
  setActiveDiscussionDropId,
  setRepliesOpen,
}: {
  readonly drop: Drop;
  readonly dropPart: DropPart;
  readonly availableCredit: number | null;
  readonly dropReplyDepth: number;
  readonly activeDiscussionDropId: string | null
  readonly showWaveInfo?: boolean;
  readonly setActiveDiscussionDropId: (id: string | null) => void;
  readonly setRepliesOpen: (state: boolean) => void;
}) {
  return (
    <DropPartDiscussionItems
      drop={drop}
      dropPart={dropPart}
      availableCredit={availableCredit}
      dropReplyDepth={dropReplyDepth}
      activeDiscussionDropId={activeDiscussionDropId}
      showWaveInfo={showWaveInfo}
      setActiveDiscussionDropId={setActiveDiscussionDropId}
      setRepliesOpen={setRepliesOpen}
    />
  );
}
