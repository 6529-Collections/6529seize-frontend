import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import { GRANTED_TABS } from "../constants";
import type { GrantedTab } from "../types";

interface UserPageXtdhGrantedListTabsProps {
  readonly activeTab: GrantedTab;
  readonly onTabChange: (tab: GrantedTab) => void;
  readonly getCount: (tab: GrantedTab) => number;
}

export function UserPageXtdhGrantedListTabs({
  activeTab,
  onTabChange,
  getCount,
}: UserPageXtdhGrantedListTabsProps) {
  const items: import("@/components/utils/select/CommonSelect").CommonSelectItem<GrantedTab>[] = GRANTED_TABS.map((tab) => {
    const count = getCount(tab.value);
    return {
      ...tab,
      label: count > 0 ? `${tab.label} ${count}` : tab.label,
    };
  });

  return (
    <div className="tw-border-b tw-border-iron-800 tw-pb-4">
      <CommonTabs<GrantedTab>
        items={items}
        activeItem={activeTab}
        setSelected={onTabChange}
        filterLabel="Select tab"
      />
    </div>
  );
}
