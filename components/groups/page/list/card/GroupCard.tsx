import { useContext, useEffect, useState } from "react";
import { GroupFull } from "../../../../../generated/models/GroupFull";
import { getRandomColorWithSeed } from "../../../../../helpers/Helpers";
import GroupCardView from "./GroupCardView";
import { AuthContext } from "../../../../auth/Auth";
import { useRouter } from "next/router";
import GroupCardVoteAll from "./vote-all/GroupCardVoteAll";
import { RateMatter } from "../../../../../generated/models/RateMatter";

export enum GroupCardState {
  IDLE = "IDLE",
  REP = "REP",
  NIC = "NIC",
}

export enum CreditDirection {
  ADD = "ADD",
  SUBTRACT = "SUBTRACT",
}

export default function GroupCard({
  group,
  activeGroupIdVoteAll,
  setActiveGroupIdVoteAll,
}: {
  readonly group: GroupFull;
  readonly activeGroupIdVoteAll: string | null;
  readonly setActiveGroupIdVoteAll: (value: string | null) => void;
}) {
  const router = useRouter();
  const { connectedProfile } = useContext(AuthContext);
  const [state, setState] = useState<GroupCardState>(GroupCardState.IDLE);

  const banner1 =
    group.created_by.banner1_color ??
    getRandomColorWithSeed(group.created_by.handle);
  const banner2 =
    group.created_by.banner2_color ??
    getRandomColorWithSeed(group.created_by.handle);

  const onGroupStateChange = (state: GroupCardState) => {
    if (state === GroupCardState.IDLE) {
      setActiveGroupIdVoteAll(null);
    } else {
      setActiveGroupIdVoteAll(group.id);
    }
    setState(state);
  };

  const getIsActiveGroupVoteAll = () => {
    return activeGroupIdVoteAll === group.id;
  };

  const isActiveGroupVoteAll = getIsActiveGroupVoteAll();

  useEffect(() => {
    if (!isActiveGroupVoteAll) {
      setState(GroupCardState.IDLE);
    }
  });

  const onActionCancel = () => onGroupStateChange(GroupCardState.IDLE);

  useEffect(() => {
    if (!connectedProfile?.profile?.handle) {
      onGroupStateChange(GroupCardState.IDLE);
    }
  }, [connectedProfile?.profile?.handle]);

  const onEditClick = (group: GroupFull) => {
    router.push(`/network/groups?edit=${group.id}`);
  };

  const components: Record<GroupCardState, JSX.Element> = {
    [GroupCardState.IDLE]: (
      <GroupCardView
        group={group}
        setState={onGroupStateChange}
        haveActiveGroupVoteAll={!!activeGroupIdVoteAll}
        onEditClick={onEditClick}
      />
    ),
    [GroupCardState.REP]: (
      <GroupCardVoteAll
        group={group}
        onCancel={onActionCancel}
        matter={RateMatter.Rep}
      />
    ),
    [GroupCardState.NIC]: (
      <GroupCardVoteAll
        group={group}
        onCancel={onActionCancel}
        matter={RateMatter.Cic}
      />
    ),
  };

  const goToCommunityView = () => {
    if (state !== GroupCardState.IDLE) return;
    router.push(`/network?page=1&group=${group.id}`);
  };

  return (
    <div
      className={`${
        state === GroupCardState.IDLE && "tw-group tw-cursor-pointer"
      } tw-col-span-1`}
      onClick={goToCommunityView}>
      <div
        className="tw-relative tw-w-full tw-h-9 tw-rounded-t-2xl"
        style={{
          background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
        }}>
        <div className="tw-absolute tw-inset-0 tw-rounded-t-2xl tw-ring-[1.5px] tw-ring-white/20 group-hover:tw-ring-white/40 tw-ring-inset tw-pointer-events-none tw-transition tw-duration-500 tw-ease-out"></div>
      </div>
      <div
        className={` ${
          connectedProfile?.profile?.handle
            ? "tw-min-h-[134px]"
            : "tw-h-[123.5px]"
        } -tw-mt-1 tw-bg-iron-900 tw-flex tw-flex-col tw-rounded-b-2xl tw-relative tw-border-[1.5px] tw-border-solid tw-border-t-0 tw-border-iron-700 group-hover:tw-border-iron-600 tw-transition tw-duration-500 tw-ease-out`}>
        {components[state]}
      </div>
    </div>
  );
}
