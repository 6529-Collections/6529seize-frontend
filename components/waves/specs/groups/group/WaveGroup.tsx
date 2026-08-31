"use client";

import type { ApiWaveScope } from "@/generated/models/ApiWaveScope";
import WaveGroupTitle from "./WaveGroupTitle";
import WaveGroupEditButtons from "./edit/WaveGroupEditButtons";
import { useContext, type ReactNode } from "react";
import { AuthContext } from "@/components/auth/Auth";
import type { ApiWave } from "@/generated/models/ApiWave";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import WaveGroupScope from "./WaveGroupScope";
import WaveGroupMembersScope from "./WaveGroupMembersScope";
import type { WaveGroupType } from "./WaveGroup.types";

export default function WaveGroup({
  scope,
  type,
  wave,
  showMembersSummary = false,
}: {
  readonly scope: ApiWaveScope;
  readonly type: WaveGroupType;
  readonly wave: ApiWave;
  readonly showMembersSummary?: boolean | undefined;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const showEdit =
    canEditWave({ connectedProfile, activeProfileProxy, wave }) &&
    !scope.group?.is_direct_message;
  const emptyScopeLabel = t(DEFAULT_LOCALE, "waves.chatSettings.access.public");
  let scopeContent: ReactNode = (
    <span className="tw-min-w-0 tw-break-words tw-py-0.5 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-50">
      {emptyScopeLabel}
    </span>
  );

  if (scope.group) {
    scopeContent = showMembersSummary ? (
      <WaveGroupMembersScope group={scope.group} />
    ) : (
      <WaveGroupScope group={scope.group} />
    );
  }

  return (
    <div className="tw-group tw-relative tw-grid tw-min-h-9 tw-w-full tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)] tw-items-center tw-gap-x-2 tw-px-2 tw-py-1.5 tw-text-sm">
      <div className="tw-flex tw-min-w-0 tw-gap-x-4 tw-py-0.5 tw-leading-5">
        <WaveGroupTitle type={type} />
      </div>
      <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-end tw-gap-x-2 tw-text-right">
        {scopeContent}
        {showEdit && (
          <div className="tw-flex tw-flex-shrink-0 tw-items-center">
            <WaveGroupEditButtons wave={wave} type={type} />
          </div>
        )}
      </div>
    </div>
  );
}
