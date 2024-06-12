import { GroupFull } from "../../../../../generated/models/GroupFull";
import CroupCardActions from "./actions/CroupCardActions";
import { GroupCardState } from "./GroupCard";
import GroupCardContent from "./GroupCardContent";
import GroupCardHeader from "./GroupCardHeader";

export default function GroupCardView({
  group,
  haveActiveGroupVoteAll,
  setState,
  onEditClick,
}: {
  readonly group: GroupFull;
  readonly haveActiveGroupVoteAll: boolean;
  readonly setState: (state: GroupCardState) => void;
  readonly onEditClick: (group: GroupFull) => void;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-h-full">
      <GroupCardHeader group={group} onEditClick={onEditClick} />
      <div className="tw-pt-3 tw-pb-3 tw-flex tw-flex-col tw-h-full tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
        <GroupCardContent group={group} />
        <div className="tw-mt-auto">
          <CroupCardActions
            group={group}
            setState={setState}
            haveActiveGroupVoteAll={haveActiveGroupVoteAll}
          />
        </div>
      </div>
    </div>
  );
}
