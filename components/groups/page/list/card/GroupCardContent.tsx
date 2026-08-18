"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { GroupCardState } from "./GroupCard";
import GroupCardConfigs from "./GroupCardConfigs";

export default function GroupCardContent({
  group,
  haveActiveGroupVoteAll,
  setState,
}: {
  readonly group?: ApiGroupFull | undefined;
  readonly haveActiveGroupVoteAll: boolean;
  readonly setState?: ((state: GroupCardState) => void) | undefined;
}) {
  const { connectedProfile } = useContext(AuthContext);

  return (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-y-3">
      <div className="tw-flex tw-flex-col tw-items-start tw-gap-y-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-gap-x-4">
        <p className="tw-mb-0 tw-w-full tw-min-w-0 tw-text-xs tw-text-iron-400 sm:tw-flex-1">
          Source: filters + optional manual list
        </p>
        {!!connectedProfile?.handle && setState && (
          <div className="tw-flex tw-w-full tw-flex-shrink-0 tw-flex-wrap tw-items-center tw-gap-2 sm:tw-w-auto sm:tw-justify-end">
            <Button
              disabled={haveActiveGroupVoteAll}
              variant="tertiary"
              size="xs"
              className="tw-relative tw-z-30"
              onClick={(event) => {
                event.stopPropagation();
                setState(GroupCardState.REP);
              }}
            >
              Rep all
            </Button>
            <Button
              disabled={haveActiveGroupVoteAll}
              variant="tertiary"
              size="xs"
              className="tw-relative tw-z-30"
              onClick={(event) => {
                event.stopPropagation();
                setState(GroupCardState.NIC);
              }}
            >
              NIC all
            </Button>
          </div>
        )}
      </div>
      <GroupCardConfigs group={group} />
    </div>
  );
}
