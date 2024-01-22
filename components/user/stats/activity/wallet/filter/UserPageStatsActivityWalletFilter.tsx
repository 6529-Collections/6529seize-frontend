import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import { UserPageStatsActivityWalletFilterType } from "../UserPageStatsActivityWallet";
import UserPageStatsActivityWalletFilterItem from "./UserPageStatsActivityWalletFilterItem";


export default function UserPageStatsActivityWalletFilter({
  activeFilter,
  setActiveFilter,
}: {
  readonly activeFilter: UserPageStatsActivityWalletFilterType;
  readonly setActiveFilter: (
    filter: UserPageStatsActivityWalletFilterType
  ) => void;
}) {
  const ACTIVITY_WALLET_FILTER_TYPE_TO_TITLE: Record<
    UserPageStatsActivityWalletFilterType,
    string
  > = {
    [UserPageStatsActivityWalletFilterType.ALL]: "All",
    [UserPageStatsActivityWalletFilterType.AIRDROPS]: "Airdrops",
    [UserPageStatsActivityWalletFilterType.MINTS]: "Mints",
    [UserPageStatsActivityWalletFilterType.SALES]: "Sales",
    [UserPageStatsActivityWalletFilterType.PURCHASES]: "Purchases",
    [UserPageStatsActivityWalletFilterType.TRANSFERS]: "Transfers",
    [UserPageStatsActivityWalletFilterType.BURNS]: "Burns",
  };

  const [isOpen, setIsOpen] = useState(false);
  const [iconScope, animateIcon] = useAnimate();
  const toggleOpen = () => setIsOpen(!isOpen);
  useEffect(() => {
    if (isOpen) {
      animateIcon(iconScope.current, { rotate: 0 });
    } else {
      animateIcon(iconScope.current, { rotate: -90 });
    }
  });
  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const onFilter = (filter: UserPageStatsActivityWalletFilterType) => {
    setActiveFilter(filter);
    setIsOpen(false);
  };

  return (
    <div className="tw-mt-2 tw-relative" ref={listRef}>
      <div className="tw-relative tw-w-full sm:tw-w-72">
        <button
          type="button"
          onClick={toggleOpen}
          className="tw-text-left tw-block sm:tw-min-w-[12rem] tw-w-full sm:tw-w-72 tw-rounded-lg tw-border-0 tw-py-2.5 sm:tw-py-2 tw-pl-3 tw-pr-10 tw-bg-iron-900 focus:tw-bg-transparent tw-text-iron-300 tw-font-semibold tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-text-sm sm:tw-leading-6 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
        >
          <span>{ACTIVITY_WALLET_FILTER_TYPE_TO_TITLE[activeFilter]}</span>
        </button>
        <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3">
          <svg
            ref={iconScope}
            className="tw-h-5 tw-w-5 tw-text-white"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
            className="tw-origin-top-right tw-absolute tw-mt-1 tw-w-full md:tw-w-72 tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
              <div className="tw-py-1 tw-flow-root tw-max-h-[calc(240px+_-5vh)] tw-overflow-x-hidden tw-overflow-y-auto">
                <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                  {Object.values(UserPageStatsActivityWalletFilterType).map(
                    (filter) => (
                      <UserPageStatsActivityWalletFilterItem
                        key={`nft-activity-${filter}`}
                        filter={filter}
                        title={ACTIVITY_WALLET_FILTER_TYPE_TO_TITLE[filter]}
                        activeFilter={activeFilter}
                        onFilter={onFilter}
                      />
                    )
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
