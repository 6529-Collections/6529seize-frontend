import { DropFull } from "../../../../entities/IDrop";
import { useState } from "react";
import DropListItemData from "./data/DropListItemData";
import DropListItemActions from "./action/DropListItemActions";
import DropListItemDiscussionWrapper from "./discussion/DropListItemDiscussionWrapper";
import DropWrapper from "../../create/utils/DropWrapper";
import DropListItemContent from "./content/DropListItemContent";
import DropListItemRepWrapper from "./reps/DropListItemRepWrapper";

export default function DropsListItem({ drop }: { readonly drop: DropFull }) {
  const [discussionOpen, setDiscussionOpen] = useState<boolean>(false);
  const haveData = !!drop.mentioned_users.length || !!drop.metadata.length;

  return (
    <div className="tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-rounded-xl tw-bg-iron-900">
      <div className="tw-p-4 sm:tw-p-5">
        <DropWrapper
          pfpUrl={drop.author.pfp}
          handle={drop.author.handle}
          timestamp={drop.created_at}
        >
          <div className="tw-w-full">
            <DropListItemContent drop={drop} />
            <DropListItemRepWrapper drop={drop} />
          </div>
        </DropWrapper>
        {haveData && <DropListItemData drop={drop} />}
        <DropListItemActions
          drop={drop}
          discussionOpen={discussionOpen}
          setDiscussionOpen={setDiscussionOpen}
        />
      </div>
      <DropListItemDiscussionWrapper
        drop={drop}
        discussionOpen={discussionOpen}
      />
    </div>
  );
}
