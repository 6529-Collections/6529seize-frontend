"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import type { UserPageTabConfig, UserPageTabKey } from "./userTabs.config";

interface UserPageTabProps {
  readonly tab: UserPageTabConfig;
  readonly activeTabId: UserPageTabKey;
}

export default function UserPageTab({
  tab,
  activeTabId,
}: UserPageTabProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const handleOrWallet = params["user"].toString();

  const path = `/${handleOrWallet}/${tab.route}`;

  const isActive = tab.id === activeTabId;

  const activeClasses =
    "tw-flex tw-items-center tw-border-transparent tw-border-solid tw-border-x-0 tw-border-t-0 tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-font-semibold tw-py-4 tw-px-1";
  const inActiveClasses =
    "tw-flex tw-items-center tw-border-transparent tw-text-iron-500 hover:tw-border-gray-300 hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-py-4 tw-px-1 tw-transition tw-duration-300 tw-ease-out";

  const classes = isActive ? activeClasses : inActiveClasses;

  const ref = useRef<HTMLAnchorElement>(null);
  const linkLabel = tab.badge ? `${tab.title} ${tab.badge}` : tab.title;
  const tabQuery: Record<string, string> = {};
  const addressParam = searchParams.get("address");
  const localeParam = searchParams.get("locale");

  if (addressParam) {
    tabQuery["address"] = addressParam;
  }
  if (localeParam) {
    tabQuery["locale"] = localeParam;
  }

  useEffect(() => {
    const activeLink = ref.current;
    const scrollContainer = activeLink?.closest<HTMLElement>(
      "[data-profile-tabs-scroll]"
    );
    if (!activeLink || !scrollContainer || !isActive) {
      return;
    }

    const containerRect = scrollContainer.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const isVisible =
      linkRect.left >= containerRect.left &&
      linkRect.right <= containerRect.right;

    if (!isVisible) {
      activeLink.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [isActive]);

  return (
    <Link
      ref={ref}
      href={{
        pathname: path,
        query: tabQuery,
      }}
      className={`${
        isActive ? "tw-pointer-events-none" : ""
      } tw-p-0 tw-text-base tw-font-medium tw-leading-4 tw-no-underline`}
      aria-current={isActive ? "page" : undefined}
      aria-label={linkLabel}
    >
      <div className={classes}>
        {tab.title}
        {tab.badge && (
          <span className="tw-ml-1 tw-rounded-full tw-bg-primary-300/20 tw-px-1.5 tw-py-0.5 tw-text-[0.625rem] tw-font-bold tw-uppercase tw-leading-none tw-tracking-wider tw-text-primary-400">
            {tab.badge}
          </span>
        )}
      </div>
    </Link>
  );
}
