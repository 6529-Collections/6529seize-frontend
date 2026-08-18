"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import GroupCardConfigs from "@/components/groups/page/list/card/GroupCardConfigs";
import type { ApiGroup } from "@/generated/models/ApiGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";

type InspectableGroup = ApiGroupFull & Pick<Partial<ApiGroup>, "is_hidden">;

export default function CommunityMembersGroupDetails({
  groupId,
  onClose,
}: {
  readonly groupId: string;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const {
    data: group,
    isLoading,
    isError,
  } = useQuery<InspectableGroup>({
    queryKey: [QueryKey.GROUP, groupId],
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

  if (
    isError ||
    !group ||
    group.name.trim().length === 0 ||
    group.id.trim().length === 0 ||
    group.is_hidden === true ||
    group.is_private === true ||
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

  return (
    <section
      aria-labelledby="selected-group-name"
      className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-p-3"
    >
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-min-w-0">
          <p className="tw-mb-1 tw-mt-0 tw-text-[0.625rem] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.08em] tw-text-iron-400">
            {t(locale, "network.groupInspection.selectedGroup")}
          </p>
          <h2
            id="selected-group-name"
            className="tw-m-0 tw-break-words !tw-text-base !tw-font-semibold !tw-leading-5 !tw-text-iron-50"
          >
            {groupName}
          </h2>
        </div>
        {closeButton}
      </div>
      <div className="tw-mt-2.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-2.5">
        <GroupCardConfigs group={group} />
      </div>
    </section>
  );
}
