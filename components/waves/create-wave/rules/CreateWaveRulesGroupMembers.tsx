"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import GroupMembersPreviewDialog from "@/components/groups/members/GroupMembersPreviewDialog";
import GroupMembersPreviewTrigger from "@/components/groups/members/GroupMembersPreviewTrigger";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { commonApiFetch } from "@/services/api/common-api";
import type { GroupMembersPreviewTarget } from "@/services/api/group-members-api";

type CreateWaveRulesGroupMembersProps =
  | {
      readonly groupId: string;
      readonly cachedGroup: ApiGroupFull | undefined;
      readonly roleLabel: string;
    }
  | {
      readonly target: GroupMembersPreviewTarget;
      readonly roleLabel: string;
    };

export default function CreateWaveRulesGroupMembers(
  props: CreateWaveRulesGroupMembersProps
) {
  const [isOpen, setIsOpen] = useState(false);
  const groupId = "groupId" in props ? props.groupId : null;
  const cachedGroup = "groupId" in props ? props.cachedGroup : undefined;
  const { data: restoredGroup } = useQuery<ApiGroupFull>({
    queryKey: [QueryKey.GROUPS, "create-wave-selected-group", groupId],
    queryFn: async () => {
      if (!groupId) {
        throw new Error("A selected group id is required");
      }
      return await commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${encodeURIComponent(groupId)}`,
      });
    },
    enabled: groupId !== null && cachedGroup === undefined,
    staleTime: 60_000,
  });
  const group =
    cachedGroup ??
    restoredGroup ??
    ({ id: groupId, name: "Selected group" } as ApiGroupFull);
  const target: GroupMembersPreviewTarget =
    "target" in props ? props.target : { kind: "saved", group };

  return (
    <>
      <GroupMembersPreviewTrigger
        target={target}
        appearance="summary"
        onOpen={() => setIsOpen(true)}
      />
      {isOpen ? (
        <GroupMembersPreviewDialog
          target={target}
          roleLabel={props.roleLabel}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  );
}
