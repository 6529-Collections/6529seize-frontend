import { DropFull } from "../../../../../entities/IDrop";
import { DropDiscussionExpandableState } from "../DropsListItem";

import DropListItemActionsDiscussion from "./DropListItemActionsDiscussion";
import DropListItemActionsQuote from "./DropListItemActionsQuote";
import DropListItemActionsRate from "./DropListItemActionsRate";

export default function DropListItemActions({
  drop,
  discussionExpandableState,
  isQuoteMode,
  setDiscussionExpandableState,
  setIsQuoteMode,
}: {
  readonly drop: DropFull;
  readonly discussionExpandableState: DropDiscussionExpandableState;
  readonly isQuoteMode: boolean;
  readonly setDiscussionExpandableState: (
    newState: DropDiscussionExpandableState
  ) => void;
  readonly setIsQuoteMode: (newState: boolean) => void;
}) {
  const onDiscussionExpandableStateChange = (
    newState: DropDiscussionExpandableState
  ) => {
    setDiscussionExpandableState(
      newState === discussionExpandableState
        ? DropDiscussionExpandableState.IDLE
        : newState
    );
  };

  return (
    <div className="tw-relative tw-z-[1] sm:tw-ml-12 tw-mt-4 tw-border-t tw-flex tw-items-center tw-justify-between  sm:tw-justify-start sm:tw-gap-x-12">
      <DropListItemActionsDiscussion
        drop={drop}
        setState={onDiscussionExpandableStateChange}
      />
      <DropListItemActionsQuote
        drop={drop}
        isQuoteMode={isQuoteMode}
        setIsQuoteMode={setIsQuoteMode}
      />
      <div className="tw-mt-0.5">
        <DropListItemActionsRate
          drop={drop}
          setState={onDiscussionExpandableStateChange}
        />
      </div>
    </div>
  );
}
