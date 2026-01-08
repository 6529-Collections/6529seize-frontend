import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";

export default function GroupCreateDirection({
  direction,
  label,
  setDirection,
}: {
  readonly direction: ApiGroupFilterDirection;
  readonly label: string;
  readonly setDirection: (newV: ApiGroupFilterDirection) => void;
}) {
  const items: CommonSelectItem<ApiGroupFilterDirection>[] = [
    {
      label: `${label} to`,
      value: ApiGroupFilterDirection.Sent,
      key: ApiGroupFilterDirection.Sent,
    },
    {
      label: `${label} from`,
      value: ApiGroupFilterDirection.Received,
      key: ApiGroupFilterDirection.Received,
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
