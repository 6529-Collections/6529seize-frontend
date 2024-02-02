import { CommonSelectProps } from "../CommonSelect";
import CommonTabsTab from "./CommonTabsTab";

export default function CommonTabs<T, U = unknown>(props: CommonSelectProps<T, U>) {
  const { items, activeItem, setSelected } = props;
  return (
    <div className="tw-inline-flex tw-rounded-lg tw-w-full sm:tw-w-auto -tw-space-x-px">
      {Object.values(items).map((item, i) => (
        <CommonTabsTab
          key={item.key}
          item={item}
          isFirst={i === 0}
          isLast={i === items.length - 1}
          activeItem={activeItem}
          sortDirection={
            "sortDirection" in props ? props.sortDirection : undefined
          }
          setSelected={setSelected}
        />
      ))}
    </div>
  );
}
