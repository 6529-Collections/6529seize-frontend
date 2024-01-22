import { USER_PAGE_ACTIVITY_TAB } from "../UserPageActivityWrapper";
import UserPageActivityTab from "./UserPageActivityTab";

export default function UserPageActivityTabs({
  activeTab,
  setActiveTab,
}: {
  readonly activeTab: USER_PAGE_ACTIVITY_TAB;
  readonly setActiveTab: (tab: USER_PAGE_ACTIVITY_TAB) => void;
}) {
  return (
    <div className="tw-inline-flex tw-rounded-lg tw-overflow-hidden">
      {Object.values(USER_PAGE_ACTIVITY_TAB).map((tab) => (
        <UserPageActivityTab
          key={tab}
          tab={tab}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      ))}
    </div>
  );
}
