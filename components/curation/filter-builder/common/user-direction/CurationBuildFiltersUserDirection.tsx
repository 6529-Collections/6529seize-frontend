import { FilterDirection } from "../../../../../helpers/filters/Filters.types";
import { CommonSelectItem } from "../../../../utils/select/CommonSelect";
import CommonTabs from "../../../../utils/select/tabs/CommonTabs";

export default function CurationBuildFiltersUserDirection({
  userDirection,
  type,
  setUserDirection,
}: {
    readonly userDirection: FilterDirection;
    readonly type: string;
  readonly setUserDirection: (newV: FilterDirection) => void;
}) {
  const items: CommonSelectItem<FilterDirection>[] = [
    {
      label: `${type} to`,
      value: FilterDirection.SENT,
      key: FilterDirection.SENT,
    },
    {
      label: `${type} from`,
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