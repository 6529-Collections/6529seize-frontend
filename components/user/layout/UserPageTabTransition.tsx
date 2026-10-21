"use client";

import clsx from "clsx";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useUserPageNavigation } from "./UserPageNavigation";
import { getUserProfileTabsMessage } from "./user-tabs.messages";

export default function UserPageTabTransition({
  children,
}: {
  readonly children: ReactNode;
}) {
  const pathname = usePathname();
  const isPending = !!useUserPageNavigation()?.pendingTab;

  return (
    <>
      <output className="tw-sr-only">
        {isPending
          ? getUserProfileTabsMessage("user.profile.tabs.loading")
          : ""}
      </output>
      <div
        className="tw-relative"
        aria-busy={isPending}
        data-profile-tab-content
      >
        <div
          key={pathname}
          inert={isPending}
          style={{ visibility: isPending ? "hidden" : undefined }}
          className={clsx(
            "motion-safe:tw-animate-in motion-safe:tw-fade-in motion-safe:tw-slide-in-from-right-1 tw-transform-gpu motion-safe:tw-duration-150 motion-safe:tw-ease-out motion-reduce:tw-animate-none",
            // Hide transitioning descendants immediately without collapsing scroll height.
            isPending && "tw-opacity-0 tw-transition-none"
          )}
        >
          {children}
        </div>
        {isPending && (
          // Next.js recommends a 100 ms indicator delay for fast navigation:
          // https://nextjs.org/docs/app/api-reference/functions/use-link-status#gracefully-handling-fast-navigation
          // Zero duration preserves the delay without motion or delaying content.
          <div className="tw-absolute tw-inset-x-0 tw-top-0 tw-animate-[fadeIn_0s_linear_100ms_both]">
            <div
              aria-hidden="true"
              className="tw-space-y-4 motion-safe:tw-animate-pulse"
            >
              <div className="tw-h-8 tw-w-40 tw-rounded-lg tw-bg-iron-800" />
              <div className="tw-h-24 tw-rounded-xl tw-bg-iron-900" />
              <div className="tw-h-24 tw-rounded-xl tw-bg-iron-900" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
