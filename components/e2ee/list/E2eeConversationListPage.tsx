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
} from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCreateModalState from "@/hooks/useCreateModalState";
import { t } from "@/i18n/messages";
import { E2eeNewDeviceNotice } from "../devices/E2eeNewDeviceNotice";
import { E2eeRenewalBanner } from "../gate/E2eeRenewalBanner";
import { E2eeRouteGate } from "../gate/E2eeRouteGate";
import { E2eeBadge } from "../ui/E2eeBadge";
import { E2eeCenteredMessage, E2eePageShell } from "../ui/E2eePageShell";
import { E2eeConversationList } from "./E2eeConversationList";
import { useSyncEncryptedPush } from "./useSyncEncryptedPush";

const ACTION_LINK_CLASS =
  "tw-inline-flex tw-h-9 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-text-xs tw-font-semibold tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

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
  useSyncEncryptedPush();
  const { isApp, openDirectMessage } = useCreateModalState();
  // Devices and new chats only make sense once this device is turned on.
  const { status } = useE2ee();
  const ready = status === "ready";
  const showingSetup = status === "needs-enrollment" || status === "enrolling";
  return (
    <E2eePageShell
      title={showingSetup ? undefined : t(locale, "e2ee.title")}
      subtitle={
        ready ? (
          <E2eeBadge label={t(locale, "e2ee.badge.encrypted")} />
        ) : undefined
      }
      backHref={getMessagesBaseRoute(false)}
      backLabel={t(locale, "e2ee.section.plaintext")}
      backOnSmallScreensOnly
      actions={
        ready ? (
          <>
            <DevicesLink />
            {!isApp && (
              <button
                type="button"
                onClick={openDirectMessage}
                aria-label={t(locale, "quickDm.createModalTitle")}
                title={t(locale, "quickDm.createModalTitle")}
                className={
                  ACTION_LINK_CLASS +
                  " tw-border-primary-500 tw-bg-primary-500 tw-text-white lg:tw-hidden"
                }
              >
                <PlusIcon aria-hidden="true" className="tw-size-4" />
              </button>
            )}
          </>
        ) : null
      }
    >
      <E2eeRouteGate>
        {({ conversations, profileId }) => (
          <div className="tw-flex tw-w-full tw-flex-col tw-gap-3 tw-px-2 tw-py-4 sm:tw-px-4">
            <E2eeNewDeviceNotice className="tw-px-2" />
            <E2eeRenewalBanner className="tw-mx-2" />
            {conversations.length === 0 ? (
              <E2eeCenteredMessage
                icon={<LockClosedIcon className="tw-size-6" />}
                title={t(locale, "e2ee.list.empty.title")}
                body={t(locale, "e2ee.list.empty.body")}
              />
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
