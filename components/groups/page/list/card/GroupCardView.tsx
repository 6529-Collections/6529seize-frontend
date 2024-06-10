import { GroupFull } from "../../../../../generated/models/GroupFull";
import CroupCardActions from "./actions/CroupCardActions";
import { GroupCardState } from "./GroupCard";
import GroupCardContent from "./GroupCardContent";
import GroupCardHeader from "./GroupCardHeader";

export default function GroupCardView({
  group,
  setState,
}: {
  readonly group: GroupFull;
  readonly setState: (state: GroupCardState) => void;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-h-full">
      <GroupCardHeader group={group} />
      <div className="tw-pt-3 tw-pb-3 tw-flex tw-flex-col tw-h-full tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
        <GroupCardContent group={group} />
        <div className="tw-mt-auto">
          <CroupCardActions group={group} setState={setState} />
        </div>
      </div>
    </div>
  );
}
