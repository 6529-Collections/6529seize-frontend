import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import { ProfileProxyListType } from "../ProxyList";

export default function ProxyListFilters({
  selected,
  setSelected,
}: {
  readonly selected: ProfileProxyListType;
  readonly setSelected: (selected: ProfileProxyListType) => void;
}) {
  const PROFILE_PROXY_TYPE_OPTIONS: Record<
    ProfileProxyListType,
    {
      readonly label: string;
      readonly value: ProfileProxyListType;
    }
  > = {
    [ProfileProxyListType.ALL]: {
      label: "All",
      value: ProfileProxyListType.ALL,
    },
    [ProfileProxyListType.RECEIVED]: {
      label: "Received",
      value: ProfileProxyListType.RECEIVED,
    },
    [ProfileProxyListType.GRANTED]: {
      label: "Granted",
      value: ProfileProxyListType.GRANTED,
    },
  };

  const items: CommonSelectItem<ProfileProxyListType>[] = Object.values(
    PROFILE_PROXY_TYPE_OPTIONS
  ).map(({ label, value }) => ({
    label,
    value,
    key: value,
  }));

  return (
    <div className="tw-min-w-0 tw-flex-1 tw-basis-52">
      <CommonTabs
        variant="connected"
        items={items}
        activeItem={selected}
        filterLabel="Proxy Type"
        setSelected={setSelected}
        fill={false}
      />
    </div>
  );
}
