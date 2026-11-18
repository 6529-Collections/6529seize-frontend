"use client";

import { useEffect, useId, useRef, useState } from "react";
import { E2eeDialog } from "@/components/e2ee/ui/E2eeDialog";
import { tCount } from "@/components/e2ee/e2eeFormat";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatList } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { SecurityDevice } from "./classifyDevices";
import { DeviceMeta, formatDeviceWithPermissions } from "./DeviceParts";

/** What a revoke of the device stops: it must match what was reviewed. */
const scopeOf = (device: SecurityDevice): string =>
  [
    device.signedPosts?.status === "active",
    device.encryptedDms?.status === "active",
  ].join(":");

/**
 * One reviewed revoke for earlier setups of this browser. The devices listed
 * when it opens are pre-selected (mount it per opening, with a key); the
 * user can keep any of them, and one that becomes eligible later is listed
 * unselected. Revokes run one after another, only for devices still
 * eligible, and failures are named.
 */
export function CleanUpDialog({
  devices,
  open,
  signed,
  onRevoke,
  onClose,
  onDone,
}: {
  readonly devices: readonly SecurityDevice[];
  readonly open: boolean;
  /** Revokes are signed here, so a device can delete its saved chats. */
  readonly signed: boolean;
  readonly onRevoke: (device: SecurityDevice) => Promise<void>;
  readonly onClose: () => void;
  readonly onDone: (revoked: number) => void;
}) {
  const locale = useBrowserLocale();
  const listId = useId();
  const [chosen, setChosen] = useState<ReadonlySet<string>>(
    () => new Set(devices.map((device) => device.id))
  );
  const [pending, setPending] = useState(false);
  const [failedLabels, setFailedLabels] = useState<readonly string[]>([]);
  // The current list: a device no longer eligible drops out.
  const selected = devices.filter((device) => chosen.has(device.id));
  const deletesChats =
    signed &&
    selected.some((device) => device.encryptedDms?.status === "active");
  // The latest eligible list, read before each revoke of the batch: a
  // device may change or stop being eligible while earlier ones run.
  const latest = useRef(devices);
  useEffect(() => {
    latest.current = devices;
  });

  const close = () => {
    if (pending) {
      return;
    }
    setFailedLabels([]);
    onClose();
  };

  const confirm = async () => {
    setPending(true);
    setFailedLabels([]);
    // One at a time on purpose: each failure is named, and revokes never
    // race each other through the engine.
    const { revoked, failed } = await selected.reduce<
      Promise<{ readonly revoked: number; readonly failed: readonly string[] }>
    >(
      async (previous, confirmed) => {
        const outcome = await previous;
        const device = latest.current.find((item) => item.id === confirmed.id);
        if (!device || scopeOf(device) !== scopeOf(confirmed)) {
          // No longer eligible, or not what was reviewed: skipped.
          return outcome;
        }
        try {
          await onRevoke(device);
          return { ...outcome, revoked: outcome.revoked + 1 };
        } catch {
          return { ...outcome, failed: [...outcome.failed, device.label] };
        }
      },
      Promise.resolve({ revoked: 0, failed: [] })
    );
    setPending(false);
    if (failed.length > 0) {
      setFailedLabels(failed);
      return;
    }
    onClose();
    onDone(revoked);
  };

  return (
    <E2eeDialog
      open={open}
      onClose={close}
      title={t(locale, "devicesSecurity.cleanUp.title")}
      description={t(locale, "devicesSecurity.cleanUp.body")}
      closeLabel={t(locale, "e2ee.action.close")}
      scrollBody
      footer={
        <>
          <Button variant="secondary" size="md" onClick={close} disabled={pending}>
            {t(locale, "e2ee.action.cancel")}
          </Button>
          <Button
            variant="destructive"
            size="md"
            onClick={() => void confirm()}
            loading={pending}
            disabled={selected.length === 0}
          >
            {tCount(
              locale,
              {
                one: "devicesSecurity.cleanUp.confirm.one",
                other: "devicesSecurity.cleanUp.confirm.other",
              },
              selected.length
            )}
          </Button>
        </>
      }
    >
      <fieldset className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0">
        <legend className="tw-sr-only">
          {t(locale, "devicesSecurity.cleanUp.listLabel")}
        </legend>
        <ul
          id={listId}
          className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0"
        >
          {devices.map((device) => {
            const checkboxId = `${listId}-${device.id}`;
            return (
              <li
                key={device.id}
                className="tw-flex tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-p-3"
              >
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={chosen.has(device.id)}
                  disabled={pending}
                  onChange={(event) => {
                    const revoke = event.target.checked;
                    setChosen((current) => {
                      const next = new Set(current);
                      if (revoke) {
                        next.add(device.id);
                      } else {
                        next.delete(device.id);
                      }
                      return next;
                    });
                  }}
                  className="tw-mt-0.5 tw-size-4 tw-shrink-0 tw-accent-primary-500"
                />
                <label htmlFor={checkboxId} className="tw-min-w-0 tw-flex-1">
                  <span className="tw-block tw-break-words tw-text-sm tw-font-semibold tw-text-iron-100">
                    {formatDeviceWithPermissions(locale, device)}
                  </span>
                  <DeviceMeta locale={locale} device={device} />
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>
      {deletesChats ? (
        <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "devicesSecurity.cleanUp.deletesChats")}
        </p>
      ) : null}
      {failedLabels.length > 0 ? (
        <p role="alert" className="tw-m-0 tw-mt-3 tw-text-sm tw-text-rose-300">
          {t(locale, "devicesSecurity.cleanUp.failed", {
            labels: formatList(locale, failedLabels),
          })}
        </p>
      ) : null}
    </E2eeDialog>
  );
}
