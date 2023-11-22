import { useEffect, useState } from "react";
import { USER_PAGE_TAB_META, UserPageTabType } from "./UserPageTabs";

export default function UserPageTab({ tab, activeTab, goToTab }: { tab: UserPageTabType, activeTab: UserPageTabType, goToTab: (tab: UserPageTabType) => void }) {
  const [isActive, setIsActive] = useState<boolean>(tab === activeTab)
  useEffect(() => {
    setIsActive(tab === activeTab)
  }, [activeTab])

  const activeClasses = "tw-bg-blue-500"
  const inActiveClasses = 'tw-bg-gray-200 hover:tw-bg-gray-300'

  const [classes, setClasses] = useState<string>(isActive ? activeClasses : inActiveClasses)

  useEffect(() => {
    setClasses(isActive ? activeClasses : inActiveClasses)
  }, [isActive])



  return <button className={classes} onClick={() => goToTab(tab)}>{USER_PAGE_TAB_META[tab].title}</button>
}