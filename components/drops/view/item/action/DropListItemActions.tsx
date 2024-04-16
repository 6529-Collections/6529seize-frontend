import { DropFull } from "../../../../../entities/IDrop";
import { RepActionExpandable } from "../DropsListItem";
import DropListItemActionsDiscussion from "./DropListItemActionsDiscussion";
import DropListItemActionsQuote from "./DropListItemActionsQuote";
import DropListItemActionsRep from "./DropListItemActionsRep";

export default function DropListItemActions({
  drop,
  state,
  setState,
}: {
  readonly drop: DropFull;
  readonly state: RepActionExpandable;
  readonly setState: (newState: RepActionExpandable) => void;
}) {
  const onActionClick = (action: RepActionExpandable) => {
    setState(action === state ? RepActionExpandable.IDLE : action);
  };

  return (
    <div className="tw-relative tw-z-[1] sm:tw-ml-12 tw-mt-4 tw-border-t tw-flex tw-items-center tw-justify-between lg:tw-gap-x-8">
      <DropListItemActionsDiscussion
        drop={drop}
        activeState={state}
        setState={onActionClick}
      />
      <DropListItemActionsQuote
        drop={drop}
        activeState={state}
        setState={onActionClick}
      />
      <div className="tw-mt-0.5">
        <DropListItemActionsRep
          drop={drop}
          activeState={state}
          setState={onActionClick}
        />
      </div>
    </div>
  );
}
