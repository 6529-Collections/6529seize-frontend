"use client";

import { AuthContext } from "@/components/auth/Auth";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiRateMatter } from "@/generated/models/ApiRateMatter";
import { getRandomColorWithSeed } from "@/helpers/Helpers";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState, type JSX } from "react";
import GroupCardView from "./GroupCardView";
import GroupCardVoteAll from "./vote-all/GroupCardVoteAll";

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
  readonly group?: ApiGroupFull | undefined;
  readonly activeGroupIdVoteAll?: string | null | undefined;
  readonly setActiveGroupIdVoteAll?:
    | ((value: string | null) => void)
    | undefined
    | undefined;
  readonly userPlaceholder?: string | undefined;
  readonly titlePlaceholder?: string | undefined;
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
  const cardHref = group ? `/network?page=1&group=${group.id}` : undefined;
  const gradientStyle = {
    background: `linear-gradient(135deg, ${banner1} 0%, ${banner2} 100%)`,
  };

  return (
    <div className="tw-col-span-1 tw-relative">
      {isIdle && cardHref && (
        <button
          type="button"
          onClick={() => router.push(cardHref)}
          className="tw-absolute tw-inset-0 tw-z-0 tw-rounded-xl tw-border-0 tw-bg-transparent tw-p-0 tw-cursor-pointer focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500"
          aria-label={`Open ${cardLabel}`}
        ></button>
      )}
      <div
        className={`tw-relative tw-overflow-hidden tw-group tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-backdrop-blur-sm tw-shadow-sm tw-shadow-black/20 tw-transition-all tw-duration-300 tw-ease-out tw-cursor-pointer desktop-hover:hover:tw-shadow-lg desktop-hover:hover:tw-shadow-black/40 desktop-hover:hover:tw-translate-y-[-1px] focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-900 focus-visible:tw-outline-none tw-no-underline ${
          isIdle
            ? "tw-group desktop-hover:hover:tw-shadow-lg desktop-hover:hover:tw-shadow-black/40 desktop-hover:hover:tw-translate-y-[-1px]"
            : ""
        }`}
      >
        <div className="tw-absolute tw-inset-0 tw-rounded-t-xl tw-h-1">
          <div
            className="tw-absolute tw-inset-0 tw-opacity-80 tw-transition-opacity tw-duration-300 tw-ease-out desktop-hover:group-hover:tw-opacity-95"
            style={gradientStyle}
          ></div>
          <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-b from-black/25 via-black/10 to-transparent"></div>
        </div>
        <div className="tw-flex tw-flex-1 tw-flex-col tw-rounded-b-xl tw-bg-iron-950">
          {components[state]}
        </div>
      </div>
    </div>
  );
}
