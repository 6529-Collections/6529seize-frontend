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
      type="button"
      className={`tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-border-iron-700 tw-transition tw-duration-300 tw-ease-out ${
        tab === activeTab
          ? "tw-bg-iron-800 tw-text-iron-100"
          : "tw-bg-iron-950 hover:tw-bg-iron-900 tw-text-iron-500 hover:tw-text-iron-100"
      } ${
        tab === USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY && "tw-rounded-l-lg"
      } ${tab === USER_PAGE_ACTIVITY_TAB.TDH_HISTORY && "tw-rounded-r-lg"}`}
      onClick={() => setActiveTab(tab)}
    >
      {TAB_TO_LABEL[tab]}
    </button>
  );
}
