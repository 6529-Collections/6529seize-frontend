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
          className="tw-relative tw-flex tw-w-full tw-items-center tw-rounded-lg tw-border-0 tw-bg-white/[0.03] tw-px-3.5 tw-py-2.5 tw-text-base tw-font-medium tw-text-iron-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-white/[0.08] tw-transition tw-duration-300 tw-ease-out hover:tw-bg-white/[0.05] hover:tw-ring-white/[0.14] focus:tw-outline-none focus:tw-ring-primary-400 sm:tw-leading-6"
        >
          <span>{activeFilterLabel}</span>
        </button>
        <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3.5">
          <svg
            ref={iconScope}
            className="tw-h-4 tw-w-4 tw-text-iron-500"
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
                className="tw-absolute tw-right-0 tw-z-10 tw-mt-1.5 tw-w-full tw-origin-top-right tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-900 tw-shadow-xl"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="tw-max-h-72 tw-overflow-y-auto tw-overflow-x-hidden tw-p-1.5 tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-600 desktop-hover:hover:tw-scrollbar-thumb-iron-500">
                  <ul
                    id={FILTER_LIST_ID}
                    aria-label={getWalletActivityMessage(
                      "user.collected.stats.walletActivity.filterOptionsLabel",
                      undefined,
                      locale
                    )}
                    className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-p-0"
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
              </m.div>
            )}
          </AnimatePresence>
        </LazyMotion>
      </div>
    </div>
  );
}
