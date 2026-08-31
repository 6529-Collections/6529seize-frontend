"use client";

import { useAuth } from "@/components/auth/Auth";
import type { GroupCardRateMatter } from "@/components/groups/page/list/card/GroupCard";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import GroupCardConfigs from "@/components/groups/page/list/card/GroupCardConfigs";
import GroupCardVoteAll from "@/components/groups/page/list/card/vote-all/GroupCardVoteAll";
import Button from "@/components/utils/button/Button";
import type { ApiGroup } from "@/generated/models/ApiGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiRateMatter } from "@/generated/models/ApiRateMatter";
import { getGroupCriteriaSummary } from "@/helpers/groups/group-criteria-summary";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

type InspectableGroup = ApiGroupFull & Pick<Partial<ApiGroup>, "is_hidden">;

export default function CommunityMembersGroupDetails({
  groupId,
  onClose,
  viewerIdentityKey,
}: {
  readonly groupId: string;
  readonly onClose: () => void;
  readonly viewerIdentityKey: string | null;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile } = useAuth();
  const [activeRateSelection, setActiveRateSelection] = useState<{
    readonly groupId: string;
    readonly matter: GroupCardRateMatter | null;
  }>({ groupId, matter: null });
  const activeRateMatter =
    activeRateSelection.groupId === groupId ? activeRateSelection.matter : null;
  const bulkFormRef = useRef<HTMLDivElement>(null);
  const repButtonRef = useRef<HTMLButtonElement>(null);
  const nicButtonRef = useRef<HTMLButtonElement>(null);

  const openBulkRateForm = (matter: GroupCardRateMatter) => {
    setActiveRateSelection({ groupId, matter });
    requestAnimationFrame(() => bulkFormRef.current?.focus());
  };

  const closeBulkRateForm = () => {
    const triggerRef =
      activeRateMatter === ApiRateMatter.Rep ? repButtonRef : nicButtonRef;
    setActiveRateSelection({ groupId, matter: null });
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const {
    data: group,
    isLoading,
    isError,
  } = useQuery<InspectableGroup>({
    queryKey: [QueryKey.GROUP, groupId, { viewerIdentityKey }],
    queryFn: async () =>
      await commonApiFetch<InspectableGroup>({
        endpoint: `groups/${encodeURIComponent(groupId)}`,
      }),
  });
  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      aria-label={t(locale, "network.groupInspection.close")}
      title={t(locale, "network.groupInspection.close")}
      className="tw-flex tw-size-11 tw-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-50 sm:tw-size-8"
    >
      <XMarkIcon className="tw-size-4" aria-hidden="true" />
    </button>
  );

  if (isLoading) {
    return (
      <section
        aria-live="polite"
        className="tw-mt-3 tw-min-h-20 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-p-3"
      >
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
          <p className="tw-m-0 tw-min-w-0 tw-text-sm tw-font-medium tw-text-iron-400">
            {t(locale, "network.groupInspection.loading")}
          </p>
          {closeButton}
        </div>
      </section>
    );
  }

  // The API returns full private-group data only to the creator or an eligible
  // member, so a successful inspectable response is the authorization signal.
  if (
    isError ||
    !group ||
    typeof group.name !== "string" ||
    group.name.trim().length === 0 ||
    typeof group.id !== "string" ||
    group.id.trim().length === 0 ||
    group.is_hidden === true ||
    group.is_direct_message === true ||
    group.visible === false
  ) {
    return (
      <section
        aria-labelledby="group-criteria-unavailable-title"
        className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-p-3"
      >
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
          <h2
            id="group-criteria-unavailable-title"
            className="tw-m-0 tw-min-w-0 !tw-text-base !tw-font-semibold !tw-leading-6 !tw-text-iron-100"
          >
            {t(locale, "network.groupInspection.unavailableTitle")}
          </h2>
          {closeButton}
        </div>
        <p className="tw-mb-0 tw-mt-1.5 tw-text-sm tw-leading-5 tw-text-iron-400">
          {t(locale, "network.groupInspection.unavailableDescription")}
        </p>
      </section>
    );
  }

  const groupName = group.name.trim();
  const criteriaSummary = getGroupCriteriaSummary({
    group: group.group,
    locale,
  });
  const hasActiveCriteria =
    criteriaSummary.status === "available" && criteriaSummary.text !== null;
  const showBulkRateActions =
    hasActiveCriteria &&
    Boolean(connectedProfile?.handle) &&
    (!group.is_private || viewerIdentityKey !== null);

  return (
    <section
      aria-labelledby="selected-group-name"
      className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-p-3"
    >
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-min-w-0 tw-flex-1">
          <p className="tw-mb-1 tw-mt-0 tw-text-[0.625rem] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.08em] tw-text-iron-400">
            {t(locale, "network.groupInspection.selectedGroup")}
          </p>
          <h2
            id="selected-group-name"
            className="tw-m-0 tw-break-words !tw-text-base !tw-font-semibold !tw-leading-5 !tw-text-iron-50"
          >
            {groupName}
          </h2>
          {showBulkRateActions && activeRateMatter === null ? (
            <div
              role="group"
              aria-label={t(locale, "network.groupInspection.bulkActionsLabel")}
              className="tw-mt-3 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-flex-wrap"
            >
              <Button
                ref={repButtonRef}
                variant="secondary"
                size="sm"
                className="!tw-h-auto tw-min-h-9 tw-w-full !tw-whitespace-normal tw-py-2 tw-text-center sm:tw-w-auto"
                onClick={() => openBulkRateForm(ApiRateMatter.Rep)}
              >
                {t(locale, "network.groupInspection.bulkRep")}
              </Button>
              <Button
                ref={nicButtonRef}
                variant="secondary"
                size="sm"
                className="!tw-h-auto tw-min-h-9 tw-w-full !tw-whitespace-normal tw-py-2 tw-text-center sm:tw-w-auto"
                onClick={() => openBulkRateForm(ApiRateMatter.Cic)}
              >
                {t(locale, "network.groupInspection.bulkNic")}
              </Button>
            </div>
          ) : null}
        </div>
        {closeButton}
      </div>
      {showBulkRateActions && activeRateMatter !== null ? (
        <div
          ref={bulkFormRef}
          role="region"
          aria-label={t(
            locale,
            activeRateMatter === ApiRateMatter.Rep
              ? "network.groupInspection.bulkRep"
              : "network.groupInspection.bulkNic"
          )}
          tabIndex={-1}
          className="tw-mt-3 tw-overflow-hidden tw-rounded-lg tw-bg-black/20 tw-ring-1 tw-ring-inset tw-ring-white/5 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          <GroupCardVoteAll
            group={group}
            matter={activeRateMatter}
            viewerIdentityKey={viewerIdentityKey}
            onCancel={closeBulkRateForm}
          />
        </div>
      ) : null}
      <div className="tw-mt-2.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-2.5">
        <GroupCardConfigs group={group} />
      </div>
    </section>
  );
}
