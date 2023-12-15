import { useEffect, useState } from "react";
import { USER_PAGE_TAB_META, UserPageTabType } from "./UserPageTabs";

export default function UserPageTab({
  tab,
  activeTab,
  goToTab,
}: {
  readonly tab: UserPageTabType;
  readonly activeTab: UserPageTabType;
  readonly goToTab: (tab: UserPageTabType) => void;
}) {
  const [isActive, setIsActive] = useState<boolean>(tab === activeTab);
  useEffect(() => {
    setIsActive(tab === activeTab);
  }, [activeTab]);

  const activeClasses =
    "tw-cursor-pointer tw-border-primary-400 tw-border-solid tw-border-x-0 tw-border-t-0 tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-py-4 tw-px-1 tw-text-base tw-font-semibold";
  const inActiveClasses =
    "tw-cursor-pointer tw-border-transparent tw-text-iron-500 hover:tw-border-gray-300 hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-py-4 tw-px-1 tw-text-base tw-font-semibold tw-transition tw-duration-300 tw-ease-out";

  const [classes, setClasses] = useState<string>(
    isActive ? activeClasses : inActiveClasses
  );

  useEffect(() => {
    setClasses(isActive ? activeClasses : inActiveClasses);
  }, [isActive]);

  return (
    <button
      onClick={() => goToTab(tab)}
      className="tw-bg-transparent tw-border-none tw-m-0 tw-p-0"
    >
      <div className={classes}>{USER_PAGE_TAB_META[tab].title}</div>
    </button>
  );
}
