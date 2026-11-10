"use client";

import { useId, useState } from "react";
import {
  E2eeNewDeviceNotice,
  useAnnouncedDeviceKeys,
} from "@/components/e2ee/devices/E2eeNewDeviceNotice";
import { tCount } from "@/components/e2ee/e2eeFormat";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { BackupCard } from "./BackupCard";
import type { SecurityDevice } from "./classifyDevices";
import { CleanUpDialog } from "./CleanUpDialog";
import { Disclosure } from "./DeviceParts";
import { DeviceRow, HistoryRow } from "./DeviceRow";
import { RenameDeviceDialog } from "./RenameDeviceDialog";
import { RevokeDeviceDialog } from "./RevokeDeviceDialog";
import { ThisDeviceCard } from "./ThisDeviceCard";
import { useSecurityDevices } from "./useSecurityDevices";

function PermissionsExplainer() {
  const locale = useBrowserLocale();
  return (
    <Disclosure label={t(locale, "devicesSecurity.permissions.title")}>
      <ul className="tw-m-0 tw-flex tw-list-disc tw-flex-col tw-gap-1 tw-pb-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300">
        <li>{t(locale, "devicesSecurity.permissions.posts")}</li>
        <li>{t(locale, "devicesSecurity.permissions.dms")}</li>
        <li>{t(locale, "devicesSecurity.permissions.safety")}</li>
      </ul>
    </Disclosure>
  );
}

function GroupHeading({
  id,
  label,
  count,
}: {
  readonly id: string;
  readonly label: string;
  readonly count: number;
}) {
  const locale = useBrowserLocale();
  return (
    <h3
      id={id}
      className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-300"
    >
      {t(locale, "devicesSecurity.labelWithCount", {
        label,
        count: formatInteger(locale, count),
      })}
    </h3>
  );
}

/**
 * Preferences → Devices & security: encrypted backup first, then every
 * device once (this browser pinned), earlier setups of this browser with a
 * reviewed clean-up, and ended permissions collapsed.
 */
export default function DevicesSecuritySettings() {
  const locale = useBrowserLocale();
  const devicesTitleId = useId();
  const othersId = useId();
  const earlierId = useId();
  const security = useSecurityDevices();
  const announced = useAnnouncedDeviceKeys();
  const isNew = (device: SecurityDevice) =>
    device.encryptedDevice !== null &&
    announced.has(device.encryptedDevice.deviceKey);
  const [target, setTarget] = useState<SecurityDevice | null>(null);
  const [renaming, setRenaming] = useState<SecurityDevice | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);

  if (security.proxy) {
    return (
      <section className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5">
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "devicesSecurity.proxy")}
        </p>
      </section>
    );
  }

  const revoke = async (device: SecurityDevice) => {
    await security.revoke(device);
    setAnnouncement(
      t(locale, "devicesSecurity.revoke.done", { label: device.label })
    );
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-5">
      <E2eeNewDeviceNotice />
      <BackupCard />
      <section
        aria-labelledby={devicesTitleId}
        className="tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 sm:tw-p-5"
      >
        <div>
          <h2
            id={devicesTitleId}
            className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50"
          >
            {t(locale, "devicesSecurity.devices.title")}
          </h2>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "devicesSecurity.devices.description")}
          </p>
          <PermissionsExplainer />
        </div>
        {security.localKeysUnreadable ? (
          // Unknown, not "none": no row can be marked as this device.
          <output className="tw-block tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-200">
            {t(locale, "devicesSecurity.localUnreadable")}
          </output>
        ) : null}
        {security.failed ? (
          <div
            role="alert"
            className="tw-flex tw-flex-wrap tw-items-center tw-gap-3"
          >
            <p className="tw-m-0 tw-text-sm tw-text-iron-300">
              {t(locale, "devicesSecurity.error")}
            </p>
            <Button variant="secondary" size="sm" onClick={security.retry}>
              {t(locale, "devicesSecurity.retry")}
            </Button>
          </div>
        ) : null}
        {security.loading ? (
          <output
            aria-label={t(locale, "devicesSecurity.loading")}
            className="tw-flex tw-min-h-24 tw-items-center tw-justify-center"
          >
            <span className="tw-size-6 tw-animate-spin tw-rounded-full tw-border-2 tw-border-iron-600 tw-border-t-primary-400 motion-reduce:tw-animate-none" />
          </output>
        ) : (
          <>
            <ThisDeviceCard
              device={security.thisDevice}
              canRevoke={
                security.thisDevice !== null &&
                security.canRevoke(security.thisDevice)
              }
              canRename={
                security.thisDevice !== null &&
                security.canRename(security.thisDevice)
              }
              onRevoke={setTarget}
              onRename={setRenaming}
            />
            <div className="tw-flex tw-flex-col tw-gap-2">
              <GroupHeading
                id={othersId}
                label={t(locale, "devicesSecurity.others.title")}
                count={security.otherDevices.length}
              />
              {security.otherDevices.length === 0 ? (
                <p className="tw-m-0 tw-text-sm tw-text-iron-400">
                  {t(locale, "devicesSecurity.others.empty")}
                </p>
              ) : (
                <ul
                  aria-labelledby={othersId}
                  className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0"
                >
                  {security.otherDevices.map((device) => (
                    <DeviceRow
                      key={device.id}
                      device={device}
                      isNew={isNew(device)}
                      canRevoke={security.canRevoke(device)}
                      revokeBlocker={security.revokeBlocker(device)}
                      canRename={security.canRename(device)}
                      onRevoke={setTarget}
                      onRename={setRenaming}
                    />
                  ))}
                </ul>
              )}
            </div>
            {security.earlierSetups.length > 0 ? (
              <div className="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-amber-500/25 tw-bg-amber-500/5 tw-p-3">
                <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
                  <GroupHeading
                    id={earlierId}
                    label={t(locale, "devicesSecurity.earlier.title")}
                    count={security.earlierSetups.length}
                  />
                  {security.earlierSetups.some(security.canRevoke) ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCleaningUp(true)}
                    >
                      {t(locale, "devicesSecurity.earlier.cleanUp")}
                    </Button>
                  ) : null}
                </div>
                <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
                  {t(locale, "devicesSecurity.earlier.body")}
                </p>
                <ul
                  aria-labelledby={earlierId}
                  className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0"
                >
                  {security.earlierSetups.map((device) => (
                    <DeviceRow
                      key={device.id}
                      device={device}
                      isNew={isNew(device)}
                      canRevoke={security.canRevoke(device)}
                      revokeBlocker={security.revokeBlocker(device)}
                      canRename={security.canRename(device)}
                      onRevoke={setTarget}
                      onRename={setRenaming}
                    />
                  ))}
                </ul>
              </div>
            ) : null}
            {security.history.length > 0 ? (
              <Disclosure
                label={t(locale, "devicesSecurity.labelWithCount", {
                  label: t(locale, "devicesSecurity.history.title"),
                  count: formatInteger(locale, security.history.length),
                })}
              >
                <ul className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-p-0">
                  {security.history.map((device) => (
                    <HistoryRow key={device.id} device={device} />
                  ))}
                </ul>
                <p className="tw-m-0 tw-mt-2 tw-text-xs tw-text-iron-400">
                  {t(locale, "devicesSecurity.history.note")}
                </p>
              </Disclosure>
            ) : null}
          </>
        )}
      </section>
      <output className="tw-sr-only">{announcement}</output>
      <RenameDeviceDialog
        device={renaming}
        onRename={security.rename}
        onClose={() => setRenaming(null)}
      />
      <RevokeDeviceDialog
        device={target}
        localKeysUnreadable={security.localKeysUnreadable}
        onRevoke={revoke}
        onClose={() => setTarget(null)}
      />
      <CleanUpDialog
        devices={security.earlierSetups.filter(security.canRevoke)}
        open={cleaningUp}
        onRevoke={security.revoke}
        onClose={() => setCleaningUp(false)}
        onDone={(count) =>
          setAnnouncement(
            tCount(
              locale,
              {
                one: "devicesSecurity.cleanUp.done.one",
                other: "devicesSecurity.cleanUp.done.other",
              },
              count
            )
          )
        }
      />
    </div>
  );
}
