"use client";

import { useContext, useEffect, useState, type JSX } from "react";
import { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { getRandomColorWithSeed } from "@/helpers/Helpers";
import GroupCardView from "./GroupCardView";
import { AuthContext } from "@/components/auth/Auth";
import { useRouter } from "next/navigation";
import GroupCardVoteAll from "./vote-all/GroupCardVoteAll";
import { ApiRateMatter } from "@/generated/models/ApiRateMatter";

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
  userPlaceholder,
  titlePlaceholder,
}: {
  readonly group?: ApiGroupFull;
  readonly activeGroupIdVoteAll?: string | null;
  readonly setActiveGroupIdVoteAll?: (value: string | null) => void;
  readonly userPlaceholder?: string;
  readonly titlePlaceholder?: string;
}) {
  const router = useRouter();
  const { connectedProfile } = useContext(AuthContext);
  const [state, setState] = useState<GroupCardState>(GroupCardState.IDLE);

  const banner1 =
    group?.created_by.banner1_color ??
    getRandomColorWithSeed(group?.created_by.handle ?? "");
  const banner2 =
    group?.created_by.banner2_color ??
    getRandomColorWithSeed(group?.created_by.handle ?? "");

  const onGroupStateChange = (state: GroupCardState) => {
    if (!setActiveGroupIdVoteAll || !group) return;
    if (state === GroupCardState.IDLE) {
      setActiveGroupIdVoteAll(null);
    } else {
      setActiveGroupIdVoteAll(group.id);
    }
    setState(state);
  };

  const getIsActiveGroupVoteAll = () => {
    return activeGroupIdVoteAll === group?.id;
  };

  const isActiveGroupVoteAll = getIsActiveGroupVoteAll();

  useEffect(() => {
    if (!isActiveGroupVoteAll) {
      setState(GroupCardState.IDLE);
    }
  });

  const onActionCancel = () => onGroupStateChange(GroupCardState.IDLE);

  useEffect(() => {
    if (!connectedProfile?.handle) {
      onGroupStateChange(GroupCardState.IDLE);
    }
  }, [connectedProfile?.handle]);

  const onEditClick = (group: ApiGroupFull) => {
    router.push(`/network/groups?edit=${group.id}`);
  };

  const components: Record<GroupCardState, JSX.Element> = {
    [GroupCardState.IDLE]: (
      <GroupCardView
        group={group}
        setState={setActiveGroupIdVoteAll ? onGroupStateChange : undefined}
        haveActiveGroupVoteAll={!!activeGroupIdVoteAll}
        onEditClick={setActiveGroupIdVoteAll ? onEditClick : undefined}
        userPlaceholder={userPlaceholder}
        titlePlaceholder={titlePlaceholder}
      />
    ),
    [GroupCardState.REP]: (
      <GroupCardVoteAll
        group={group}
        onCancel={onActionCancel}
        matter={ApiRateMatter.Rep}
      />
    ),
    [GroupCardState.NIC]: (
      <GroupCardVoteAll
        group={group}
        onCancel={onActionCancel}
        matter={ApiRateMatter.Cic}
      />
    ),
  };

  const isIdle = state === GroupCardState.IDLE;
  const cardLabel =
    group?.name ?? titlePlaceholder ?? "View community group details";

  return (
    <div className="tw-col-span-1 tw-relative">
      {isIdle && (
        <button
          type="button"
          onClick={() => router.push(`/network?page=1&group=${group?.id}`)}
          className="tw-absolute tw-inset-0 tw-z-10 tw-rounded-2xl tw-border-0 tw-bg-transparent tw-p-0 tw-cursor-pointer focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500"
          aria-label={`Open ${cardLabel}`}></button>
      )}
      <div className={isIdle ? "tw-group" : ""}>
        <div
          className="tw-relative tw-w-full tw-h-9 tw-rounded-t-2xl"
          style={{
            background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
          }}>
          <div className="tw-absolute tw-inset-0 tw-rounded-t-2xl tw-ring-[1.5px] tw-ring-white/20 group-hover:tw-ring-white/40 tw-ring-inset tw-pointer-events-none tw-transition tw-duration-500 tw-ease-out"></div>
        </div>
        <div
          className={`${
            connectedProfile?.handle ? "tw-min-h-[134px]" : "tw-h-[123.5px]"
          } -tw-mt-1 tw-bg-iron-900 tw-flex tw-flex-col tw-rounded-b-2xl tw-relative tw-border-[1.5px] tw-border-solid tw-border-t-0 tw-border-iron-700 group-hover:tw-border-iron-600 tw-transition tw-duration-500 tw-ease-out`}>
          {components[state]}
        </div>
      </div>
    </div>
  );
}
