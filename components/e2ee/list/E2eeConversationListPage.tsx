"use client";

import {
  DevicePhoneMobileIcon,
  LockClosedIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import {
  getEncryptedDevicesRoute,
  getMessagesBaseRoute,
  getNewEncryptedChatRoute,
} from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { E2eeNewDeviceNotice } from "../devices/E2eeNewDeviceNotice";
import { E2eeRenewalBanner } from "../gate/E2eeRenewalBanner";
import { E2eeRouteGate } from "../gate/E2eeRouteGate";
import { E2eeBadge } from "../ui/E2eeBadge";
import { E2eeCenteredMessage, E2eePageShell } from "../ui/E2eePageShell";
import { E2eeConversationList } from "./E2eeConversationList";
import { useOpenWakeChat } from "./useOpenWakeChat";

const ACTION_LINK_CLASS =
  "tw-inline-flex tw-h-9 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-text-xs tw-font-semibold tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

export function E2eeNewChatLink({
  compact = false,
  iconOnlyOnMobile = false,
}: {
  readonly compact?: boolean | undefined;
  /** Header use: the label shows from `sm` up, the icon alone below it. */
  readonly iconOnlyOnMobile?: boolean | undefined;
}) {
  const locale = useBrowserLocale();
  const label = t(locale, "e2ee.action.newChat");
  return (
    <Link
      href={getNewEncryptedChatRoute()}
      aria-label={compact ? label : undefined}
      title={compact || iconOnlyOnMobile ? label : undefined}
      className={`${ACTION_LINK_CLASS} tw-border-primary-500 tw-bg-primary-500 tw-text-white desktop-hover:hover:tw-bg-primary-600`}
    >
      <PlusIcon aria-hidden="true" className="tw-size-4" />
      {compact ? null : (
        <span
          className={iconOnlyOnMobile ? "tw-sr-only sm:tw-not-sr-only" : ""}
        >
          {label}
        </span>
      )}
    </Link>
  );
}

function DevicesLink() {
  const locale = useBrowserLocale();
  return (
    <Link
      href={getEncryptedDevicesRoute()}
      aria-label={t(locale, "e2ee.devices.open")}
      className={`${ACTION_LINK_CLASS} tw-border-white/10 tw-bg-white/[0.07] tw-text-iron-100 desktop-hover:hover:tw-bg-white/10`}
    >
      <DevicePhoneMobileIcon aria-hidden="true" className="tw-size-4" />
      <span className="tw-hidden sm:tw-inline">
        {t(locale, "e2ee.action.devices")}
      </span>
    </Link>
  );
}

/** `/messages/encrypted`: the encrypted chats on this device. */
export function E2eeConversationListPage() {
  const locale = useBrowserLocale();
  useOpenWakeChat();
  // Devices and new chats only make sense once this device is turned on.
  const ready = useE2ee().status === "ready";
  return (
    <E2eePageShell
      title={t(locale, "e2ee.title")}
      subtitle={<E2eeBadge label={t(locale, "e2ee.badge.encrypted")} />}
      backHref={getMessagesBaseRoute(false)}
      backLabel={t(locale, "e2ee.section.plaintext")}
      backOnSmallScreensOnly
      actions={
        ready ? (
          <>
            <DevicesLink />
            <E2eeNewChatLink iconOnlyOnMobile />
          </>
        ) : null
      }
    >
      <E2eeRouteGate>
        {({ conversations, profileId }) => (
          <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-3xl tw-flex-col tw-gap-3 tw-px-2 tw-py-4 sm:tw-px-4">
            <E2eeNewDeviceNotice className="tw-px-2" />
            <E2eeRenewalBanner className="tw-mx-2" />
            {conversations.length === 0 ? (
              <E2eeCenteredMessage
                icon={<LockClosedIcon className="tw-size-6" />}
                title={t(locale, "e2ee.list.empty.title")}
                body={t(locale, "e2ee.list.empty.body")}
              >
                <E2eeNewChatLink />
              </E2eeCenteredMessage>
            ) : (
              <E2eeConversationList
                conversations={conversations}
                selfProfileId={profileId}
                label={t(locale, "e2ee.list.label")}
              />
            )}
          </div>
        )}
      </E2eeRouteGate>
    </E2eePageShell>
  );
}
