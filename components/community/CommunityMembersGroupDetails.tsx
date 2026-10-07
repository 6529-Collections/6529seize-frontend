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
import { formatInteger } from "@/i18n/format";
import { commonApiFetch } from "@/services/api/common-api";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

type InspectableGroup = ApiGroupFull & Pick<Partial<ApiGroup>, "is_hidden">;

const INSPECTION_SURFACE_CLASSES =
  "tw-mt-3 tw-min-h-36 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4";

const BULK_RATE_ACTION_CLASSES =
  "!tw-h-auto tw-min-h-11 tw-w-full !tw-whitespace-normal tw-text-left focus-visible:!tw-outline-iron-300 sm:tw-w-auto";

export default function CommunityMembersGroupDetails({
  groupId,
  onClose,
  viewerIdentityKey,
  membersCount = null,
}: {
  readonly groupId: string;
  readonly onClose: () => void;
  readonly viewerIdentityKey: string | null;
  readonly membersCount?: number | null | undefined;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile } = useAuth();
  const [activeRateSelection, setActiveRateSelection] = useState<{
    readonly groupId: string;
    readonly matter: GroupCardRateMatter | null;
  }>({ groupId, matter: null });
  const activeRateMatter =
    activeRateSelection.groupId === groupId ? activeRateSelection.matter : null;
  const repButtonRef = useRef<HTMLButtonElement>(null);
  const nicButtonRef = useRef<HTMLButtonElement>(null);

  const openBulkRateForm = (matter: GroupCardRateMatter) => {
    setActiveRateSelection({ groupId, matter });
  };

  const closeBulkRateForm = () => {
    const triggerRef =
      activeRateMatter === ApiRateMatter.Rep ? repButtonRef : nicButtonRef;
    setActiveRateSelection({ groupId, matter: null });
    requestAnimationFrame(() =>
      triggerRef.current?.focus({ preventScroll: true })
    );
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
      className="tw-flex tw-size-11 tw-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-300 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-50"
    >
      <XMarkIcon className="tw-size-4" aria-hidden="true" />
    </button>
  );

  if (isLoading) {
    return (
      <section
        aria-live="polite"
        aria-busy="true"
        className={INSPECTION_SURFACE_CLASSES}
      >
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
          <p className="tw-m-0 tw-min-w-0 tw-text-sm tw-font-medium tw-text-iron-400">
            {t(locale, "network.groupInspection.loading")}
          </p>
          {closeButton}
        </div>
        <div
          aria-hidden="true"
          className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2 motion-safe:tw-animate-pulse"
        >
          <div className="tw-h-8 tw-w-36 tw-max-w-full tw-rounded-lg tw-bg-iron-900" />
          <div className="tw-h-8 tw-w-48 tw-max-w-full tw-rounded-lg tw-bg-iron-900" />
        </div>
        {connectedProfile?.handle && (
          <div
            aria-hidden="true"
            className="tw-mt-3 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row"
          >
            <div className="tw-h-11 tw-w-full tw-rounded-lg tw-bg-iron-900 sm:tw-w-64" />
            <div className="tw-h-11 tw-w-full tw-rounded-lg tw-bg-iron-900 sm:tw-w-64" />
          </div>
        )}
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
        className={INSPECTION_SURFACE_CLASSES}
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
      className={INSPECTION_SURFACE_CLASSES}
    >
      <div className="tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-start tw-gap-x-3 tw-gap-y-2 sm:tw-grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="tw-min-w-0 tw-flex-1">
          <p className="tw-mb-1 tw-mt-0 tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-400">
            {t(locale, "network.groupInspection.selectedGroup")}
          </p>
          <h2
            id="selected-group-name"
            className="tw-m-0 tw-break-words !tw-text-sm !tw-font-medium !tw-leading-5 !tw-text-iron-300 [overflow-wrap:anywhere]"
          >
            {groupName}
          </h2>
        </div>
        <output
          aria-live="polite"
          className="tw-col-span-2 tw-row-start-2 tw-text-sm tw-tabular-nums tw-text-iron-300 sm:tw-col-span-1 sm:tw-col-start-2 sm:tw-row-start-1 sm:tw-pt-1"
        >
          {t(locale, "network.groupInspection.membersTitle")}:{" "}
          {formatInteger(locale, membersCount)}
        </output>
        {closeButton}
      </div>
      <div className="tw-mt-3">
        <GroupCardConfigs group={group} quiet />
      </div>
      {showBulkRateActions ? (
        <div
          role="group"
          aria-label={t(locale, "network.groupInspection.bulkActionsLabel")}
          className="tw-mt-3 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-flex-wrap"
        >
          <Button
            ref={repButtonRef}
            variant="ghost"
            size="sm"
            className={BULK_RATE_ACTION_CLASSES}
            onClick={() => openBulkRateForm(ApiRateMatter.Rep)}
            aria-haspopup="dialog"
          >
            {t(locale, "network.groupInspection.bulkRep")}
          </Button>
          <Button
            ref={nicButtonRef}
            variant="ghost"
            size="sm"
            className={BULK_RATE_ACTION_CLASSES}
            onClick={() => openBulkRateForm(ApiRateMatter.Cic)}
            aria-haspopup="dialog"
          >
            {t(locale, "network.groupInspection.bulkNic")}
          </Button>
        </div>
      ) : null}
      {showBulkRateActions && activeRateMatter !== null ? (
        <GroupCardVoteAll
          group={group}
          matter={activeRateMatter}
          viewerIdentityKey={viewerIdentityKey}
          onCancel={closeBulkRateForm}
        />
      ) : null}
    </section>
  );
}
