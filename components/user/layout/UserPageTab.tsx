"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { USER_PAGE_TAB_META, UserPageTabType } from "./UserPageTabs";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

const isVisibleInViewportSide = (
  elementRect: DOMRect,
  parentRect: DOMRect,
): boolean =>
  elementRect.right <= parentRect.right && elementRect.left >= parentRect.left;

export default function UserPageTab({
  tab,
  parentRef,
  activeTab,
}: {
  readonly tab: UserPageTabType;
  readonly parentRef: React.RefObject<HTMLDivElement | null>;
  readonly activeTab: UserPageTabType;
}) {
  const params = useParams();
  const searchParams = useSearchParams();
  const handleOrWallet = params?.user?.toString();

  const path = `/${handleOrWallet}/${USER_PAGE_TAB_META[tab].route}`;

  const isActive = tab === activeTab;

  const activeClasses =
    "tw-border-primary-400 tw-border-solid tw-border-x-0 tw-border-t-0 tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-font-semibold tw-py-4 tw-px-1";
  const inActiveClasses =
    "tw-border-transparent tw-text-iron-500 hover:tw-border-gray-300 hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-py-4 tw-px-1 tw-transition tw-duration-300 tw-ease-out";

  const ref = useRef<HTMLAnchorElement>(null);

  const classes = isActive ? activeClasses : inActiveClasses;

  const scrollActiveTabIntoView = useEffectEvent(() => {
    const parentElement = parentRef.current;
    const anchorElement = ref.current;

    if (!parentElement || !anchorElement) {
      return;
    }

    const parentRect = parentElement.getBoundingClientRect();
    const anchorRect = anchorElement.getBoundingClientRect();

    if (isVisibleInViewportSide(anchorRect, parentRect)) {
      return;
    }

    anchorElement.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  });

  useEffect(() => {
    if (tab !== activeTab) {
      return;
    }

    scrollActiveTabIntoView();
  }, [activeTab, scrollActiveTabIntoView, tab]);

  return (
    <Link
      ref={ref}
      href={{
        pathname: path,
        query: searchParams?.get("address")
          ? { address: searchParams.get("address")! }
          : {},
      }}
      className={`${
        isActive ? "tw-pointer-events-none" : ""
      }  tw-no-underline tw-leading-4 tw-p-0 tw-text-base tw-font-semibold`}>
      <div className={classes}>{USER_PAGE_TAB_META[tab].title}</div>
    </Link>
  );
}
