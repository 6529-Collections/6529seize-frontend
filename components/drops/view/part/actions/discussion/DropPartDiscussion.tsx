import { ApiDropPart } from "../../../../../../generated/models/ApiDropPart";
import { ApiDrop } from "../../../../../../generated/models/ApiDrop";
import DropPartDiscussionItems from "./items/DropPartDiscussionItems";

export default function DropPartDiscussion({
  drop,
  dropPart,
  dropReplyDepth,
  activeDiscussionDropId,
  showWaveInfo = true,
  setActiveDiscussionDropId,
  setRepliesOpen,
}: {
  readonly drop: ApiDrop;
  readonly dropPart: ApiDropPart;
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
      dropReplyDepth={dropReplyDepth}
      activeDiscussionDropId={activeDiscussionDropId}
      showWaveInfo={showWaveInfo}
      setActiveDiscussionDropId={setActiveDiscussionDropId}
      setRepliesOpen={setRepliesOpen}
    />
  );
}
