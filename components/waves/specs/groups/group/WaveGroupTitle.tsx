import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { WaveGroupType } from "./WaveGroup.types";

export default function WaveGroupTitle({
  type,
}: {
  readonly type: WaveGroupType;
}) {
  const LABELS: Record<WaveGroupType, MessageKey> = {
    [WaveGroupType.VIEW]: "waves.chatSettings.groups.view",
    [WaveGroupType.DROP]: "waves.chatSettings.groups.drop",
    [WaveGroupType.VOTE]: "waves.chatSettings.groups.vote",
    [WaveGroupType.CHAT]: "waves.chatSettings.access.label",
    [WaveGroupType.ADMIN]: "waves.chatSettings.groups.admin",
  };
  return (
    <div className="tw-flex tw-items-center">
      <span className="tw-font-normal tw-text-iron-500">
        {t(DEFAULT_LOCALE, LABELS[type])}
      </span>
    </div>
  );
}
