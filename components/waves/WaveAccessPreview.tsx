import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { WaveGroupsConfig } from "@/types/waves.types";

/** Describe the selected audiences without implying that other rules disappear. */
function getPreviewKey(
  waveType: ApiWaveType,
  groups: Pick<WaveGroupsConfig, "canChat" | "canDrop">,
  chatEnabled: boolean
): MessageKey {
  if (waveType === ApiWaveType.Chat) {
    return groups.canChat === null
      ? "waves.access.preview.chatPublic"
      : "waves.access.preview.chatGroup";
  }
  if (!chatEnabled) {
    return groups.canDrop === null
      ? "waves.access.preview.chatDisabledSubmitPublic"
      : "waves.access.preview.chatDisabledSubmitGroup";
  }
  if (groups.canChat === null) {
    return groups.canDrop === null
      ? "waves.access.preview.bothPublic"
      : "waves.access.preview.chatPublicSubmitGroup";
  }
  if (groups.canDrop === null)
    return "waves.access.preview.chatGroupSubmitPublic";
  return groups.canChat === groups.canDrop
    ? "waves.access.preview.sameGroup"
    : "waves.access.preview.differentGroups";
}

/** Announce the access consequence as organizers change chat/submission groups. */
export default function WaveAccessPreview({
  waveType,
  groups,
  chatEnabled,
}: {
  readonly waveType: ApiWaveType;
  readonly groups: Pick<WaveGroupsConfig, "canChat" | "canDrop">;
  readonly chatEnabled: boolean;
}) {
  const locale = useBrowserLocale();

  return (
    <output className="tw-m-0 tw-block tw-text-pretty tw-text-sm tw-leading-6 tw-text-iron-300">
      {t(locale, getPreviewKey(waveType, groups, chatEnabled))}
    </output>
  );
}
