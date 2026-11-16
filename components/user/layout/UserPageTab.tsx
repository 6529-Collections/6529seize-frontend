"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import type { UserPageTabConfig, UserPageTabKey } from "./userTabs.config";
import { useUserPageNavigation } from "./UserPageNavigation";
import { getUnderlineTabClasses } from "@/components/common/underlineTabStyles";

interface UserPageTabProps {
  readonly tab: UserPageTabConfig;
  readonly activeTabId: UserPageTabKey;
}

export default function UserPageTab({ tab, activeTabId }: UserPageTabProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const navigation = useUserPageNavigation();
  const handleOrWallet = params["user"]?.toString() ?? "";

  const path = `/${handleOrWallet}/${tab.route}`;

  const isActive = tab.id === activeTabId;

  const classes = `${getUnderlineTabClasses({ active: isActive, externalIndicator: true })} tw-flex tw-items-center tw-py-4 tw-px-0`;

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
  if (tab.route === "xtdh") {
    tabQuery["tab"] = "granted";
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
      scrollContainer.scrollBy({
        left:
          linkRect.left -
          containerRect.left -
          (containerRect.width - linkRect.width) / 2,
        behavior: globalThis.matchMedia("(prefers-reduced-motion: reduce)")
          .matches
          ? "instant"
          : "smooth",
      });
    }
  }, [isActive]);

  return (
    <Link
      ref={ref}
      scroll={false}
      onNavigate={(event) => {
        if (!navigation) return;
        event.preventDefault();
        if (isActive) return;
        const queryString = new URLSearchParams(tabQuery).toString();
        navigation.navigate(
          queryString ? `${path}?${queryString}` : path,
          tab.id
        );
      }}
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
          <span className="tw-ml-1.5 tw-rounded-full tw-bg-white/5 tw-px-1.5 tw-py-0.5 tw-text-[0.625rem] tw-font-semibold tw-uppercase tw-leading-none tw-tracking-wider tw-text-iron-400 tw-ring-1 tw-ring-inset tw-ring-white/10">
            {tab.badge}
          </span>
        )}
      </div>
    </Link>
  );
}
