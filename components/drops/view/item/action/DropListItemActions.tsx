import { DropFull } from "../../../../../entities/IDrop";
import { DropActionExpandable } from "../DropsListItem";
import DropListItemActionsDiscussion from "./DropListItemActionsDiscussion";
import DropListItemActionsQuote from "./DropListItemActionsQuote";
import DropListItemActionsRate from "./DropListItemActionsRate";

export default function DropListItemActions({
  drop,
  state,
  setState,
}: {
  readonly drop: DropFull;
  readonly state: DropActionExpandable;
  readonly setState: (newState: DropActionExpandable) => void;
}) {
  const onActionClick = (action: DropActionExpandable) => {
    setState(action === state ? DropActionExpandable.IDLE : action);
  };

  return (
    <div className="tw-relative tw-z-[1] sm:tw-ml-12 tw-mt-4 tw-border-t tw-flex tw-items-center tw-justify-between sm:tw-justify-start sm:tw-gap-x-12">
      <DropListItemActionsDiscussion drop={drop} setState={onActionClick} />
      <DropListItemActionsQuote drop={drop} setState={onActionClick} />
      <DropListItemActionsRate drop={drop} setState={onActionClick} />
    </div>
  );
}
