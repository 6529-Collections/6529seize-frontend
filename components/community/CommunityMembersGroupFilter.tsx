"use client";

import { useContext } from "react";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import GroupAssignmentPanel from "@/components/groups/assignment/GroupAssignmentPanel";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useGroupCriteria } from "@/hooks/groups/useGroupCriteria";
import { useGroupMutations } from "@/hooks/groups/useGroupMutations";
import { t } from "@/i18n/messages";

export default function CommunityMembersGroupFilter({
  activeGroupId,
  onGroupChange,
}: {
  readonly activeGroupId: string | null;
  readonly onGroupChange: (group: ApiGroupFull | null) => void;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, requestAuth, setToast } = useContext(AuthContext);
  const { onGroupCreate } = useContext(ReactQueryWrapperContext);
  const currentCriteria = useGroupCriteria(activeGroupId);
  const { submit } = useGroupMutations({ requestAuth, onGroupCreate });

  const createAndFilter = async (
    payload: ApiCreateGroup
  ): Promise<ApiGroupFull | null> => {
    const result = await submit({
      payload,
      currentHandle: connectedProfile?.handle ?? null,
    });

    if (!result.ok) {
      if (result.reason !== "auth") {
        setToast({
          type: "error",
          title: t(locale, "network.groupFilter.createErrorTitle"),
          description: t(locale, "network.groupFilter.createErrorDescription"),
          details: result.error,
        });
      }
      return null;
    }

    setToast({
      message: t(locale, "network.groupFilter.createSuccess"),
      type: "success",
    });
    return result.group;
  };

  if (currentCriteria.isLoading) {
    return (
      <output
        aria-live="polite"
        className="tw-flex tw-min-h-52 tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-p-5 tw-text-sm tw-font-medium tw-text-iron-400"
      >
        <CircleLoader />
        <span>{t(locale, "network.groupInspection.loading")}</span>
      </output>
    );
  }

  if (currentCriteria.isError || currentCriteria.criteria === null) {
    return (
      <div
        role="alert"
        className="tw-flex tw-min-h-52 tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-p-5 tw-text-center"
      >
        <div>
          <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-text-iron-100">
            {t(locale, "network.groupInspection.unavailableTitle")}
          </p>
          <p className="tw-mb-0 tw-text-sm tw-leading-5 tw-text-iron-400">
            {t(locale, "network.groupInspection.unavailableDescription")}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={currentCriteria.retry}>
          {t(locale, "waves.create.groups.editAccess.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="tw-p-4 sm:tw-p-6">
      <GroupAssignmentPanel
        key={currentCriteria.criteria.group?.id ?? "all-network-members"}
        suggestedName={t(locale, "network.groupFilter.suggestedName")}
        defaultLabel={t(locale, "network.groupFilter.defaultLabel")}
        selectedGroup={currentCriteria.criteria.group}
        selectedGroupIncludedWallets={currentCriteria.criteria.includedWallets}
        selectedGroupExcludedWallets={currentCriteria.criteria.excludedWallets}
        allowGroupClear
        collapseOnClickAway={false}
        startMode="criteria"
        membersRoleLabel={t(locale, "network.groupFilter.membersRoleLabel")}
        onChange={(group) => {
          onGroupChange(group);
          return true;
        }}
        onCreateGroup={createAndFilter}
      />
    </div>
  );
}
