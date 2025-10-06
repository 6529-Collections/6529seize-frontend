"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { GroupCardState } from "./GroupCard";
import GroupCardConfigs from "./GroupCardConfigs";

export default function GroupCardContent({
  group,
  haveActiveGroupVoteAll,
  setState,
  titlePlaceholder,
}: {
  readonly group?: ApiGroupFull;
  readonly haveActiveGroupVoteAll: boolean;
  readonly setState?: (state: GroupCardState) => void;
  readonly titlePlaceholder?: string;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const disabledClasses =
    "tw-opacity-50 tw-text-iron-600 tw-border-iron-800 tw-cursor-default";
  const nonDisabledClasses =
    "hover:tw-bg-iron-700 tw-border-iron-700 tw-text-iron-300 hover:tw-text-iron-50";
  return (
    <div className="tw-flex-1 tw-px-4 sm:tw-px-5">
      <div className="tw-flex tw-items-center tw-gap-x-3 tw-justify-between">
        <p
          title={group?.name ?? ""}
          className="tw-mb-0 tw-text-xl tw-text-iron-50 tw-font-semibold tw-whitespace-nowrap tw-overflow-hidden tw-text-overflow-ellipsis tw-truncate">
          {group?.name ?? titlePlaceholder ?? ""}
        </p>
        {!!connectedProfile?.handle && setState && (
          <div className="tw-flex tw-items-center tw-gap-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setState(GroupCardState.REP);
              }}
              type="button"
              disabled={haveActiveGroupVoteAll}
              className={`${
                haveActiveGroupVoteAll ? disabledClasses : nonDisabledClasses
              } tw-whitespace-nowrap tw-inline-flex tw-items-center tw-bg-iron-800 tw-border tw-border-solid tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out`}>
              Rep all
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setState(GroupCardState.NIC);
              }}
              type="button"
              disabled={haveActiveGroupVoteAll}
              className={`${
                haveActiveGroupVoteAll ? disabledClasses : nonDisabledClasses
              } tw-whitespace-nowrap tw-inline-flex tw-items-center tw-bg-iron-800 tw-border tw-border-solid tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out`}>
              NIC all
            </button>
          </div>
        )}
      </div>
      <GroupCardConfigs group={group} />
    </div>
  );
}
