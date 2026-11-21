"use client";

import {
  DevicePhoneMobileIcon,
  LockClosedIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import Button from "@/components/utils/button/Button";
import { getButtonClasses } from "@/components/utils/button/buttonStyles";
import { type UseE2eeResult, useE2ee } from "@/hooks/e2ee/useE2ee";
import {
  getEncryptedDevicesRoute,
  getMessagesBaseRoute,
} from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCreateModalState from "@/hooks/useCreateModalState";
import { t } from "@/i18n/messages";
import { E2EE_INITIAL_INBOX_WAIT_MS } from "@/lib/e2ee/types";
import { E2eeNewDeviceNotice } from "../devices/E2eeNewDeviceNotice";
import { E2eeRenewalBanner } from "../gate/E2eeRenewalBanner";
import { BackupNudgeBanner } from "../backup/BackupNudgeBanner";
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
      {/* A short label on phones (no icon-only entry to backup), the full
          one from sm; the accessible name contains both. */}
      <span className="sm:tw-hidden">
        {t(locale, "e2ee.action.devicesShort")}
      </span>
      <span className="tw-hidden sm:tw-inline">
        {t(locale, "e2ee.action.devices")}
      </span>
    </Link>
  );
}

function EncryptedChats({ e2ee }: { readonly e2ee: UseE2eeResult }) {
  const locale = useBrowserLocale();
  const { conversations, profileId, initialSyncStatus, engine } = e2ee;
  const hasChats = conversations.length > 0;
  const waiting = initialSyncStatus === "waiting";
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    if (!checking) return;
    const timer = globalThis.setTimeout(
      () => setChecking(false),
      E2EE_INITIAL_INBOX_WAIT_MS
    );
    return () => globalThis.clearTimeout(timer);
  }, [checking]);
  const loading =
    checking || waiting || (!hasChats && initialSyncStatus === "pending");
  const loadingPadding = hasChats ? "tw-py-3" : "tw-py-12";
  const showRetry =
    !checking &&
    !hasChats &&
    (initialSyncStatus === "failed" || initialSyncStatus === "delayed");
  const awaitingInvitation = initialSyncStatus === "awaiting-invitation";
  const showEmpty =
    !checking &&
    !hasChats &&
    (awaitingInvitation || initialSyncStatus === "complete");
  const emptyTitle = t(
    locale,
    awaitingInvitation
      ? "e2ee.list.awaitingInvitation.title"
      : "e2ee.list.empty.title"
  );
  const checkAgain = () => {
    if (!engine) return;
    setChecking(true);
    void engine
      .sync({ recheckInbox: true })
      .catch(() => undefined)
      .finally(() => setChecking(false));
  };
  let status = "";
  if (loading) status = t(locale, "e2ee.list.loading");
  if (waiting && !checking) status = t(locale, "e2ee.list.waiting");
  if (showRetry) {
    status = t(
      locale,
      initialSyncStatus === "delayed" ? "e2ee.list.delayed" : "e2ee.list.error"
    );
  }
  if (showEmpty && awaitingInvitation) status = emptyTitle;

  return (
    <>
      {hasChats && (
        <E2eeConversationList
          conversations={conversations}
          selfProfileId={profileId}
          label={t(locale, "e2ee.list.label")}
        />
      )}
      <output
        className={
          loading
            ? `tw-flex tw-items-center tw-justify-center tw-gap-3 tw-px-6 tw-text-center tw-text-sm tw-text-iron-400 motion-reduce:[&>svg]:tw-animate-none ${loadingPadding}`
            : "tw-sr-only"
        }
      >
        {loading && <CircleLoader />}
        {status}
      </output>
      {showRetry && (
        <E2eeCenteredMessage title={status}>
          <Button variant="secondary" size="md" onClick={checkAgain}>
            {t(locale, "e2ee.action.retry")}
          </Button>
        </E2eeCenteredMessage>
      )}
      {showEmpty && (
        <E2eeCenteredMessage
          icon={<LockClosedIcon className="tw-size-6" />}
          title={emptyTitle}
          body={t(
            locale,
            awaitingInvitation
              ? "e2ee.list.awaitingInvitation.body"
              : "e2ee.list.empty.body"
          )}
        >
          {awaitingInvitation && (
            <div className="tw-flex tw-flex-wrap tw-justify-center tw-gap-2">
              <Link
                href={getEncryptedDevicesRoute()}
                className={getButtonClasses({
                  variant: "secondary",
                  className: "tw-no-underline",
                })}
              >
                {t(locale, "e2ee.list.awaitingInvitation.action")}
              </Link>
              <Button variant="ghost" size="md" onClick={checkAgain}>
                {t(locale, "e2ee.list.checkAgain")}
              </Button>
            </div>
          )}
        </E2eeCenteredMessage>
      )}
    </>
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
          <E2eeBadge
            label={t(locale, "e2ee.badge.encrypted")}
            shortLabel={t(locale, "e2ee.badge.encryptedShort")}
          />
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
        {(e2ee) => (
          <div className="tw-flex tw-w-full tw-flex-col tw-gap-3 tw-px-2 tw-py-4 sm:tw-px-4">
            <E2eeNewDeviceNotice className="tw-px-2" />
            <E2eeRenewalBanner className="tw-mx-2" />
            <BackupNudgeBanner className="tw-mx-2" />
            <EncryptedChats e2ee={e2ee} />
          </div>
        )}
      </E2eeRouteGate>
    </E2eePageShell>
  );
}
