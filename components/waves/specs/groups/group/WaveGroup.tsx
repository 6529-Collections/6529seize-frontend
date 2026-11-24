"use client";

import type { ApiWaveScope } from "@/generated/models/ApiWaveScope";
import WaveGroupTitle from "./WaveGroupTitle";
import WaveGroupEditButtons from "./edit/WaveGroupEditButtons";
import { useContext } from "react";
import { WaveInformationPanelContext } from "@/components/brain/mobile/WaveInformationPanelContext";
import { AuthContext } from "@/components/auth/Auth";
import type { ApiWave } from "@/generated/models/ApiWave";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import WaveGroupMembersScope from "./WaveGroupMembersScope";
import { WaveGroupType } from "./WaveGroup.types";

export default function WaveGroup({
  scope,
  type,
  wave,
}: {
  readonly scope: ApiWaveScope;
  readonly type: WaveGroupType;
  readonly wave: ApiWave;
}) {
  const phone = useContext(WaveInformationPanelContext)?.isPhone === true;
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const showEdit =
    type !== WaveGroupType.DROP &&
    type !== WaveGroupType.VOTE &&
    canEditWave({ connectedProfile, activeProfileProxy, wave }) &&
    !scope.group?.is_direct_message;
  const emptyScopeLabel = t(DEFAULT_LOCALE, "waves.chatSettings.access.public");
  const scopeContent = scope.group ? (
    <WaveGroupMembersScope group={scope.group} />
  ) : (
    <span className="tw-min-w-0 tw-break-words tw-py-0.5 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-50">
      {emptyScopeLabel}
    </span>
  );

  return (
    <div
      className={`tw-group tw-relative tw-grid ${phone ? "tw-min-h-12" : "tw-min-h-9"} tw-w-full tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)] tw-items-center tw-gap-x-2 tw-px-2 tw-py-1.5 tw-text-sm [&_a]:tw-relative [&_a]:tw-z-10`}
    >
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
