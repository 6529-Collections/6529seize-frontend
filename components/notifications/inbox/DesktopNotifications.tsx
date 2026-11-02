"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import dynamic from "next/dynamic";
import { useId } from "react";
import BellIcon from "@/components/common/icons/BellIcon";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

function InboxLoading() {
  const locale = useBrowserLocale();
  return (
    <output className="tw-block tw-p-6 tw-text-sm tw-text-iron-300">
      {t(locale, "notifications.inbox.loading")}
    </output>
  );
}

const Inbox = dynamic(() => import("./NotificationsInbox"), {
  loading: InboxLoading,
});

export default function DesktopNotifications({
  collapsed,
  unread,
}: {
  readonly collapsed: boolean;
  readonly unread: boolean;
}) {
  const locale = useBrowserLocale();
  const title = t(locale, "notifications.inbox.title");
  const unreadDescriptionId = useId();
  return (
    <Popover>
      {({ open, close }) => (
        <>
          <PopoverButton
            aria-label={title}
            aria-describedby={unread ? unreadDescriptionId : undefined}
            data-tooltip-id="sidebar-tooltip"
            data-tooltip-content={title}
            data-tooltip-hidden={!collapsed || open}
            className="tw-flex tw-h-[2.875rem] tw-w-full tw-items-center tw-gap-2 tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-2 tw-text-left tw-text-base tw-font-medium tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-white"
          >
            <span className="tw-flex tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center">
              <span className="tw-relative">
                <BellIcon aria-hidden="true" className="tw-size-6" />
                {unread && (
                  <span
                    aria-hidden="true"
                    className="tw-absolute tw-right-0 tw-top-0 tw-size-2 tw-rounded-full tw-bg-red"
                  />
                )}
              </span>
            </span>
            {!collapsed && <span>{title}</span>}
            {unread && (
              <span id={unreadDescriptionId} className="tw-sr-only">
                {t(locale, "notifications.inbox.unread")}
              </span>
            )}
          </PopoverButton>
          <PopoverPanel
            focus
            anchor={{ to: "right end", gap: 12, padding: 16 }}
            role="region"
            aria-label={title}
            className="tailwind-scope tw-z-[100] tw-flex tw-max-h-[min(36rem,calc(100dvh-2rem))] tw-w-[26rem] tw-max-w-[calc(100vw-2rem)] tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-shadow-2xl focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {open && <Inbox onClose={() => close()} />}
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}
