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
  const buttonBaseClasses =
    "tw-relative tw-z-30 tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/12 tw-bg-white/5 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-100 tw-shadow-sm tw-shadow-black/20 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500";
  const disabledClasses =
    "tw-cursor-not-allowed tw-border-white/5 tw-bg-white/5 tw-text-iron-400 tw-opacity-45";
  const enabledClasses =
    "desktop-hover:hover:tw-border-white/25 desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-white";

  return (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-y-3">
      <div className="tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-x-4 tw-gap-y-2">
        <div className="tw-min-w-0 tw-flex-1">
          <p
            title={group?.name ?? ""}
            className="tw-mb-0 tw-line-clamp-2 tw-text-lg tw-font-semibold tw-leading-tight tw-text-iron-50">
            {group?.name ?? titlePlaceholder ?? ""}
          </p>
        </div>
        {!!connectedProfile?.handle && setState && (
          <div className="tw-flex tw-flex-shrink-0 tw-flex-wrap tw-items-center tw-justify-end tw-gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setState(GroupCardState.REP);
              }}
              type="button"
              disabled={haveActiveGroupVoteAll}
              className={`${buttonBaseClasses} ${
                haveActiveGroupVoteAll ? disabledClasses : enabledClasses
              }`}
            >
              Rep all
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setState(GroupCardState.NIC);
              }}
              type="button"
              disabled={haveActiveGroupVoteAll}
              className={`${buttonBaseClasses} ${
                haveActiveGroupVoteAll ? disabledClasses : enabledClasses
              }`}
            >
              NIC all
            </button>
          </div>
        )}
      </div>
      <GroupCardConfigs group={group} />
    </div>
  );
}
