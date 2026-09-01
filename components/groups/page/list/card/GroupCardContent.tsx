"use client";

import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import GroupCardConfigs from "./GroupCardConfigs";

export default function GroupCardContent({
  group,
}: {
  readonly group?: ApiGroupFull | undefined;
}) {
  const locale = useBrowserLocale();

  return (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-y-3">
      <p className="tw-mb-0 tw-w-full tw-min-w-0 tw-text-xs tw-text-iron-400">
        {t(locale, "network.groupInspection.source")}
      </p>
      <GroupCardConfigs group={group} />
    </div>
  );
}
