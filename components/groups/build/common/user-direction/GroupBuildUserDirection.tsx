import { GroupFilterDirection } from "../../../../../generated/models/GroupFilterDirection";
import { CommonSelectItem } from "../../../../utils/select/CommonSelect";
import CommonTabs from "../../../../utils/select/tabs/CommonTabs";

export default function GroupBuildUserDirection({
  userDirection,
  type,
  setUserDirection,
}: {
  readonly userDirection: GroupFilterDirection;
  readonly type: string;
  readonly setUserDirection: (newV: GroupFilterDirection) => void;
}) {
  const items: CommonSelectItem<GroupFilterDirection>[] = [
    {
      label: `${type} to`,
      value: GroupFilterDirection.Sent,
      key: GroupFilterDirection.Sent,
    },
    {
      label: `${type} from`,
      value: GroupFilterDirection.Received,
      key: GroupFilterDirection.Received,
    },
  ];
  return (
    <CommonTabs
      items={items}
      activeItem={userDirection}
      filterLabel="User Direction"
      setSelected={setUserDirection}
    />
  );
}
