"use client";

import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useAnimate,
} from "framer-motion";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { useEffect, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import { UserPageStatsActivityWalletFilterType } from "../UserPageStatsActivityWallet.types";
import {
  getWalletActivityFilterLabel,
  getWalletActivityFilterOptionLabel,
  getWalletActivityMessage,
} from "../wallet-activity.messages";
import UserPageStatsActivityWalletFilterItem from "./UserPageStatsActivityWalletFilterItem";

const FILTER_LIST_ID = "wallet-activity-filter-options";

export default function UserPageStatsActivityWalletFilter({
  activeFilter,
  setActiveFilter,
  locale = DEFAULT_LOCALE,
}: {
  readonly activeFilter: UserPageStatsActivityWalletFilterType;
  readonly setActiveFilter: (
    filter: UserPageStatsActivityWalletFilterType
  ) => void;
  readonly locale?: SupportedLocale | undefined;
}) {
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
  const activeFilterLabel = getWalletActivityFilterLabel(activeFilter, locale);

  return (
    <div className="tw-w-full sm:tw-max-w-xs" ref={listRef}>
      <div className="tw-relative">
        <button
          type="button"
          onClick={toggleOpen}
          aria-expanded={isOpen}
          aria-controls={FILTER_LIST_ID}
          aria-label={getWalletActivityMessage(
            "user.collected.stats.walletActivity.filterButtonLabel",
            { filter: activeFilterLabel },
            locale
          )}
          className="tw-relative tw-flex tw-w-full tw-items-center tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3.5 tw-py-2.5 tw-text-base tw-font-medium tw-text-iron-50 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-600 focus:tw-bg-transparent focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-leading-6"
        >
          <span>{activeFilterLabel}</span>
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
        <LazyMotion features={domAnimation}>
          <AnimatePresence mode="wait" initial={false}>
            {isOpen && (
              <m.div
                className="tw-absolute tw-right-0 tw-z-10 tw-mt-1 tw-w-full tw-origin-top-right tw-rounded-lg tw-bg-iron-800 tw-shadow-xl tw-ring-1 tw-ring-black tw-ring-opacity-5"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="tw-absolute tw-z-10 tw-mt-1 tw-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
                  <div className="tw-flow-root tw-max-h-[calc(16rem+_-10svh)] tw-overflow-y-auto tw-overflow-x-hidden tw-py-1">
                    <ul
                      id={FILTER_LIST_ID}
                      aria-label={getWalletActivityMessage(
                        "user.collected.stats.walletActivity.filterOptionsLabel",
                        undefined,
                        locale
                      )}
                      className="tw-mx-0 tw-mb-0 tw-flex tw-list-none tw-flex-col tw-px-2"
                    >
                      {Object.values(UserPageStatsActivityWalletFilterType).map(
                        (filter) => (
                          <UserPageStatsActivityWalletFilterItem
                            key={`nft-activity-${filter}`}
                            filter={filter}
                            title={getWalletActivityFilterLabel(filter, locale)}
                            ariaLabel={getWalletActivityFilterOptionLabel(
                              filter,
                              locale
                            )}
                            activeFilter={activeFilter}
                            onFilter={onFilter}
                          />
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </LazyMotion>
      </div>
    </div>
  );
}
