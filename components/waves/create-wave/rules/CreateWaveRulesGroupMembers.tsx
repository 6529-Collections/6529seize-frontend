"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import GroupMembersPreviewDialog from "@/components/groups/members/GroupMembersPreviewDialog";
import GroupMembersPreviewTrigger from "@/components/groups/members/GroupMembersPreviewTrigger";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
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
  const locale = useBrowserLocale();
  const [isOpen, setIsOpen] = useState(false);
  const groupId = "groupId" in props ? props.groupId : null;
  const savedGroupId = groupId ?? "";
  const cachedGroup = "groupId" in props ? props.cachedGroup : undefined;
  const { data: restoredGroup, isError } = useQuery<ApiGroupFull>({
    queryKey: [QueryKey.GROUPS, "create-wave-selected-group", savedGroupId],
    queryFn: async () =>
      await commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${encodeURIComponent(savedGroupId)}`,
      }),
    enabled: groupId !== null && cachedGroup === undefined,
    staleTime: 60_000,
  });
  const group = cachedGroup ?? restoredGroup;
  let target: GroupMembersPreviewTarget | null = null;
  if ("target" in props) {
    target = props.target;
  } else if (group) {
    target = { kind: "saved", group };
  }

  if (target === null) {
    const statusLabel = isError
      ? t(locale, "waves.create.groups.members.countUnavailable")
      : t(locale, "waves.create.groups.members.countLoading");
    return (
      <output className="tw-text-sm tw-font-medium tw-text-iron-400">
        {statusLabel}
      </output>
    );
  }

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
