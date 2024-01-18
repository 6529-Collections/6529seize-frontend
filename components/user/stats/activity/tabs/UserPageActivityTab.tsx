import { USER_PAGE_ACTIVITY_TAB } from "../UserPageActivityWrapper";

export default function UserPageActivityTab({
  tab,
  activeTab,
  setActiveTab,
}: {
  readonly tab: USER_PAGE_ACTIVITY_TAB;
  readonly activeTab: USER_PAGE_ACTIVITY_TAB;
  readonly setActiveTab: (tab: USER_PAGE_ACTIVITY_TAB) => void;
}) {
  const TAB_TO_LABEL: Record<USER_PAGE_ACTIVITY_TAB, string> = {
    [USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY]: "Wallet Activity",
    [USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS]: "Distributions",
    [USER_PAGE_ACTIVITY_TAB.TDH_HISTORY]: "TDH History",
  };
  return (
    <button
      className={`${tab === activeTab ? "tw-bg-blue-500" : "tw-bg-gray-500"}`}
      onClick={() => setActiveTab(tab)}
    >
      {TAB_TO_LABEL[tab]}
    </button>
  );
}
