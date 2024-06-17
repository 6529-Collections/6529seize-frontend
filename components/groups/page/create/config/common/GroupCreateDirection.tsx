import { GroupFilterDirection } from "../../../../../../generated/models/GroupFilterDirection";
import { CommonSelectItem } from "../../../../../utils/select/CommonSelect";
import CommonTabs from "../../../../../utils/select/tabs/CommonTabs";

export default function GroupCreateDirection({
  direction,
  label,
  setDirection,
}: {
  readonly direction: GroupFilterDirection;
  readonly label: string;
  readonly setDirection: (newV: GroupFilterDirection) => void;
}) {
  const items: CommonSelectItem<GroupFilterDirection>[] = [
    {
      label: `${label} to`,
      value: GroupFilterDirection.Sent,
      key: GroupFilterDirection.Sent,
    },
    {
      label: `${label} from`,
      value: GroupFilterDirection.Received,
      key: GroupFilterDirection.Received,
    },
  ];
  return (
    <CommonTabs
      items={items}
      activeItem={direction}
      filterLabel="Identity Direction"
      setSelected={setDirection}
    />
  );
}
