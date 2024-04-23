import { Drop } from "../../../../../entities/IDrop";
import DiscussSolidIcon from "../../../../utils/icons/DiscussSolidIcon";
import DiscussOutlineIcon from "../../../../utils/icons/DiscussOutlineIcon";
import DropListItemActionsItemWrapper from "./DropListItemActionsItemWrapper";
import { DropDiscussionExpandableState } from "../DropsListItem";

export default function DropListItemActionsDiscussion({
  drop,
  setState,
}: {
  readonly drop: Drop;
  readonly setState: (state: DropDiscussionExpandableState) => void;
}) {
  const userHaveDiscussed =
    !!drop.context_profile_context?.discussion_comments_count;
  return (
    <DropListItemActionsItemWrapper
      state={DropDiscussionExpandableState.DISCUSSION}
      setState={setState}
    >
      <>
        {userHaveDiscussed ? <DiscussSolidIcon /> : <DiscussOutlineIcon />}
        <span className="tw-text-iron-400 tw-hidden sm:tw-block tw-transition tw-ease-out tw-duration-300">
          Discuss
        </span>
        {!!drop.discussion_comments_count && (
          <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/5 tw-h-5 tw-px-1 tw-min-w-[1.25rem] tw-text-iron-300 tw-text-xs tw-font-medium">
            {drop.discussion_comments_count}
          </div>
        )}
      </>
    </DropListItemActionsItemWrapper>
  );
}
