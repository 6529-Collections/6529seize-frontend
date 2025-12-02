import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import { GRANTED_TABS } from "../constants";
import type { GrantedTab } from "../types";

interface UserPageXtdhGrantedListTabsProps {
  readonly activeTab: GrantedTab;
  readonly onTabChange: (tab: GrantedTab) => void;
  readonly fill?: boolean;
  readonly pendingCount?: number;
}

export function UserPageXtdhGrantedListTabs({
  activeTab,
  onTabChange,
  fill,
  pendingCount,
}: UserPageXtdhGrantedListTabsProps) {
  const items: import("@/components/utils/select/CommonSelect").CommonSelectItem<GrantedTab>[] = GRANTED_TABS.map((tab) => ({
    ...tab,
    label: tab.label,
    badge: tab.value === "PENDING" ? pendingCount : undefined,
  }));

  return (
    <div>
      <CommonTabs<GrantedTab>
        items={items}
        activeItem={activeTab}
        setSelected={onTabChange}
        filterLabel="Select tab"
        fill={fill}
      />
    </div>
  );
}
