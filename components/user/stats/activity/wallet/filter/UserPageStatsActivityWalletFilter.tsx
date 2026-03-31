"use client";

import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import { UserPageStatsActivityWalletFilterType } from "../UserPageStatsActivityWallet.types";
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
    <div className="tw-w-full sm:tw-max-w-xs" ref={listRef}>
      <div className="tw-relative">
        <button
          type="button"
          onClick={toggleOpen}
          className="tw-relative tw-flex tw-w-full tw-items-center tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3.5 tw-py-2.5 tw-text-base tw-font-medium tw-text-iron-50 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-600 focus:tw-bg-transparent focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-leading-6"
        >
          <span>{ACTIVITY_WALLET_FILTER_TYPE_TO_TITLE[activeFilter]}</span>
        </button>
        <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3.5">
          <svg
            ref={iconScope}
            className="tw-h-5 tw-w-5 tw-text-white"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
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
        <AnimatePresence mode="wait" initial={false}>
          {isOpen && (
            <motion.div
              className="tw-absolute tw-right-0 tw-z-10 tw-mt-1 tw-w-full tw-origin-top-right tw-rounded-lg tw-bg-iron-800 tw-shadow-xl tw-ring-1 tw-ring-black tw-ring-opacity-5"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="tw-absolute tw-z-10 tw-mt-1 tw-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
                <div className="tw-flow-root tw-max-h-[calc(16rem+_-10svh)] tw-overflow-y-auto tw-overflow-x-hidden tw-py-1">
                  <ul className="tw-mx-0 tw-mb-0 tw-flex tw-list-none tw-flex-col tw-px-2">
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
    </div>
  );
}
