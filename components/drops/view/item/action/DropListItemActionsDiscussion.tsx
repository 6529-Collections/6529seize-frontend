import { DropFull } from "../../../../../entities/IDrop";
import DiscussSolidIcon from "../../../../utils/icons/DiscussSolidIcon";
import DiscussOutlineIcon from "../../../../utils/icons/DiscussOutlineIcon";
import { DropActionExpandable } from "../DropsListItem";
import DropListItemActionsItemWrapper from "./DropListItemActionsItemWrapper";

export default function DropListItemActionsDiscussion({
  drop,
  setState,
}: {
  readonly drop: DropFull;
  readonly setState: (state: DropActionExpandable) => void;
}) {
  const userHaveDiscussed = !!drop.input_profile_discussion_comments_count;
  return (
    <DropListItemActionsItemWrapper
      state={DropActionExpandable.DISCUSSION}
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
