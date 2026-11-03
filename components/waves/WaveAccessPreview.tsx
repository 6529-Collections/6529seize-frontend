import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { WaveGroupsConfig } from "@/types/waves.types";

/** Describe audiences independently of whether a restricted group's ID is visible. */
function getPreviewKey(
  waveType: ApiWaveType,
  groups: Pick<WaveGroupsConfig, "canChat" | "canDrop">,
  chatEnabled: boolean,
  chatRestricted: boolean
): MessageKey {
  if (waveType === ApiWaveType.Chat) {
    return chatRestricted
      ? "waves.access.preview.chatGroup"
      : "waves.access.preview.chatPublic";
  }
  if (!chatEnabled) {
    return groups.canDrop === null
      ? "waves.access.preview.chatDisabledSubmitPublic"
      : "waves.access.preview.chatDisabledSubmitGroup";
  }
  if (!chatRestricted) {
    return groups.canDrop === null
      ? "waves.access.preview.bothPublic"
      : "waves.access.preview.chatPublicSubmitGroup";
  }
  if (groups.canDrop === null)
    return "waves.access.preview.chatGroupSubmitPublic";
  if (groups.canChat === null)
    return "waves.access.preview.chatGroupSubmitGroup";
  return groups.canChat === groups.canDrop
    ? "waves.access.preview.sameGroup"
    : "waves.access.preview.differentGroups";
}

/** Announce the access consequence as organizers change chat/submission groups. */
export default function WaveAccessPreview({
  waveType,
  groups,
  chatEnabled,
  chatRestricted = groups.canChat !== null,
}: {
  readonly waveType: ApiWaveType;
  readonly groups: Pick<WaveGroupsConfig, "canChat" | "canDrop">;
  readonly chatEnabled: boolean;
  readonly chatRestricted?: boolean | undefined;
}) {
  const locale = useBrowserLocale();

  return (
    <output className="tw-m-0 tw-block tw-text-pretty tw-text-sm tw-leading-6 tw-text-iron-300">
      {t(locale, getPreviewKey(waveType, groups, chatEnabled, chatRestricted))}
    </output>
  );
}
