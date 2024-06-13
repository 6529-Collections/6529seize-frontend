import { useContext } from "react";
import { GroupFull } from "../../../../../generated/models/GroupFull";
import { AuthContext } from "../../../../auth/Auth";

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
  const { connectedProfile } = useContext(AuthContext);
  return (
    <div className="tw-flex tw-flex-col tw-h-full">
      <GroupCardHeader group={group} onEditClick={onEditClick} />
      <div className="tw-pt-2 tw-flex tw-flex-col tw-h-full">
        <GroupCardContent
          group={group}
          haveActiveGroupVoteAll={haveActiveGroupVoteAll}
          setState={setState}
        />
      </div>
    </div>
  );
}
