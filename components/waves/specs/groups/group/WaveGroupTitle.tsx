import { WaveGroupType } from "./WaveGroup.types";

export default function WaveGroupTitle({
  type,
}: {
  readonly type: WaveGroupType;
}) {
  const LABELS: Record<WaveGroupType, string> = {
    [WaveGroupType.VIEW]: "View",
    [WaveGroupType.DROP]: "Drop",
    [WaveGroupType.VOTE]: "Vote",
    [WaveGroupType.CHAT]: "Chat",
    [WaveGroupType.ADMIN]: "Admin",
  };
  return (
    <div className="tw-flex tw-items-center">
      <span className="tw-font-medium tw-text-iron-500">{LABELS[type]}</span>
    </div>
  );
}
