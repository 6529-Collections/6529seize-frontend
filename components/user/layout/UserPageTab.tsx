"use client";

import { useEffect, useRef, useState } from "react";
import { USER_PAGE_TAB_META, UserPageTabType } from "./UserPageTabs";
import { useRouter } from "next/router";
import Link from "next/link";

export default function UserPageTab({
  tab,
  parentRef,
  activeTab,
}: {
  readonly tab: UserPageTabType;
  readonly parentRef: React.RefObject<HTMLDivElement | null>;
  readonly activeTab: UserPageTabType;
}) {
  const router = useRouter();
  const handleOrWallet = router.query.user as string;

  const path = `/${handleOrWallet}/${USER_PAGE_TAB_META[tab].route}`;

  const [isActive, setIsActive] = useState<boolean>(tab === activeTab);
  useEffect(() => {
    setIsActive(tab === activeTab);
  }, [activeTab]);

  const activeClasses =
    "tw-border-primary-400 tw-border-solid tw-border-x-0 tw-border-t-0 tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-font-semibold tw-py-4 tw-px-1";
  const inActiveClasses =
    "tw-border-transparent tw-text-iron-500 hover:tw-border-gray-300 hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-py-4 tw-px-1 tw-transition tw-duration-300 tw-ease-out";

  const [classes, setClasses] = useState<string>(
    isActive ? activeClasses : inActiveClasses
  );

  const ref = useRef<HTMLAnchorElement>(null);

  const isVisibleInViewportSide = () => {
    if (!parentRef.current || !ref.current) {
      return true;
    }
    const parentRect = parentRef.current.getBoundingClientRect();
    const rect = ref.current.getBoundingClientRect();
    const parentRight = parentRect.right;
    const parentLeft = parentRect.left;
    const elementRight = rect.right;
    const elementLeft = rect.left;
    return elementRight <= parentRight && elementLeft >= parentLeft;
  };

  useEffect(() => {
    setClasses(isActive ? activeClasses : inActiveClasses);
    if (ref.current && isActive && !isVisibleInViewportSide()) {
      ref.current.scrollIntoView({
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
        query: router.query.address ? { address: router.query.address } : {},
      }}
      className={`${
        isActive ? "tw-pointer-events-none" : ""
      }  tw-no-underline tw-leading-4 tw-p-0 tw-text-base tw-font-semibold`}>
      <div className={classes}>{USER_PAGE_TAB_META[tab].title}</div>
    </Link>
  );
}
