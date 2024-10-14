import Tippy from "@tippyjs/react";
import { ApiDropPart } from "../../../../../../generated/models/ApiDropPart";
import DiscussOutlineIcon from "../../../../../utils/icons/DiscussOutlineIcon";
import DiscussSolidIcon from "../../../../../utils/icons/DiscussSolidIcon";

export default function DropPartDiscussionButton({
  dropPart,
  onDiscussionButtonClick,
}: {
  readonly dropPart: ApiDropPart;
  readonly onDiscussionButtonClick: () => void;
}) {
  const discussionCount = dropPart.replies_count;
  const userHaveDiscussed = !!dropPart.context_profile_context?.replies_count;

  return (
    <Tippy content="Replies">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDiscussionButtonClick();
        }}
        type="button"
        className="tw-text-iron-500 icon tw-p-0 tw-group tw-bg-transparent tw-border-0 tw-inline-flex tw-items-center tw-gap-x-2 
        tw-text-[0.8125rem] tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300"
      >
        {userHaveDiscussed ? <DiscussSolidIcon /> : <DiscussOutlineIcon />}

        {!!discussionCount && (
          <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-iron-500 tw-text-xs tw-font-normal">
            {discussionCount}
          </div>
        )}
      </button>
    </Tippy>
  );
}
