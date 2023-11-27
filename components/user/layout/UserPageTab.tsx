import { useEffect, useState } from "react";
import { USER_PAGE_TAB_META, UserPageTabType } from "./UserPageTabs";

export default function UserPageTab({ tab, activeTab, goToTab }: { tab: UserPageTabType, activeTab: UserPageTabType, goToTab: (tab: UserPageTabType) => void }) {
  const [isActive, setIsActive] = useState<boolean>(tab === activeTab)
  useEffect(() => {
    setIsActive(tab === activeTab)
  }, [activeTab])

  const activeClasses = "tw-border-primary-400 tw-border-solid tw-border-x-0 tw-border-t-0 tw-text-neutral-100 tw-whitespace-nowrap tw-border-b-2 tw-py-4 tw-px-1 tw-text-base tw-font-semibold"
  const inActiveClasses = 'tw-border-transparent tw-text-neutral-500 hover:tw-border-gray-300 hover:tw-text-neutral-100 tw-whitespace-nowrap tw-border-b-2 tw-py-4 tw-px-1 tw-text-base tw-font-semibold'

  const [classes, setClasses] = useState<string>(isActive ? activeClasses : inActiveClasses)

  useEffect(() => {
    setClasses(isActive ? activeClasses : inActiveClasses)
  }, [isActive])



  return <div className={classes} onClick={() => goToTab(tab)}>{USER_PAGE_TAB_META[tab].title}</div>
}