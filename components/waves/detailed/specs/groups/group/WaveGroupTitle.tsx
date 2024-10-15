import { WaveGroupType } from "./WaveGroup";
import WaveGroupAdminIcon from "./WaveGroupAdminIcon";
import WaveGroupDropIcon from "./WaveGroupDropIcon";
import WaveGroupViewIcon from "./WaveGroupViewIcon";
import WaveGroupVoteIcon from "./WaveGroupVoteIcon";

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

  const ICONS: Record<WaveGroupType, JSX.Element> = {
    [WaveGroupType.VIEW]: <WaveGroupViewIcon />,
    [WaveGroupType.DROP]: <WaveGroupDropIcon />,
    [WaveGroupType.VOTE]: <WaveGroupVoteIcon />,
    [WaveGroupType.CHAT]: <WaveGroupDropIcon />,
    [WaveGroupType.ADMIN]: <WaveGroupAdminIcon />,
  };
  return (
    <div className="tw-flex tw-items-center">
      {ICONS[type]}

      <span className="tw-font-medium tw-text-iron-500">{LABELS[type]}</span>
    </div>
  );
}
