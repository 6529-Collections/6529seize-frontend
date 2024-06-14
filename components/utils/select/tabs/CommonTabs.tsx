import { CommonSelectProps } from "../CommonSelect";
import CommonTabsTab from "./CommonTabsTab";

export default function CommonTabs<T, U = unknown>(
  props: CommonSelectProps<T, U>
) {
  const { items, activeItem, setSelected } = props;
  return (
    <div className="tw-p-1 tw-relative tw-ring-1 tw-ring-inset tw-bg-iron-950 tw-ring-iron-700 tw-inline-flex tw-rounded-lg tw-w-full sm:tw-w-auto tw-gap-x-1">
      {Object.values(items).map((item, i) => (
        <CommonTabsTab
          key={item.key}
          item={item}
          itemIdx={i}
          totalItems={items.length}
          activeItem={activeItem}
          sortDirection={
            "sortDirection" in props ? props.sortDirection : undefined
          }
          setSelected={setSelected}
          isMobile={false}
        />
      ))}
    </div>
  );
}
