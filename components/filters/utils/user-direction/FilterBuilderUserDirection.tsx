import { CommonSelectItem } from "../../../utils/select/CommonSelect";
import CommonTabs from "../../../utils/select/tabs/CommonTabs";
import { FilterDirection } from "../../FilterBuilder";

export default function FilterBuilderUserDirection({
  userDirection,
  setUserDirection,
}: {
  readonly userDirection: FilterDirection;
  readonly setUserDirection: (newV: FilterDirection) => void;
}) {
  const items: CommonSelectItem<FilterDirection>[] = [
    {
      label: "Show Givers",
      value: FilterDirection.SENT,
      key: FilterDirection.SENT,
    },
    {
      label: "Show Receivers",
      value: FilterDirection.RECEIVED,
      key: FilterDirection.RECEIVED,
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
