"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import {
  E2EE_DIALOG_SCROLL_REGION,
  E2eeDialog,
} from "@/components/e2ee/ui/E2eeDialog";
import { tCount } from "@/components/e2ee/e2eeFormat";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatList } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { revokeScope, type SecurityDevice } from "./classifyDevices";
import { DeviceMeta, formatDeviceWithPermissions } from "./DeviceParts";

/** What one confirmed batch did. */
interface BatchReport {
  readonly revoked: number;
  /** The revoke failed. */
  readonly failed: readonly string[];
  /** Changed after it was reviewed: not revoked, listed as it is now. */
  readonly changed: readonly string[];
  /** Left the clean-up while still active (for example now another device): not tried. */
  readonly notAttempted: readonly string[];
  /** Revokes started or stopped being signed here: the rest weren't tried. */
  readonly stopped: boolean;
}

const NO_REPORT: BatchReport = {
  revoked: 0,
  failed: [],
  changed: [],
  notAttempted: [],
  stopped: false,
};

/** Anything the user has to review before confirming again. */
const needsReview = (report: BatchReport) =>
  report.failed.length > 0 ||
  report.changed.length > 0 ||
  report.notAttempted.length > 0 ||
  report.stopped;

/** What the last confirm left for review: revoked, failed, changed, stopped. */
function CleanUpReport({ report }: { readonly report: BatchReport }) {
  const locale = useBrowserLocale();
  if (!needsReview(report)) {
    return null;
  }
  return (
    <div
      role="alert"
      className="tw-mt-3 tw-flex tw-flex-col tw-gap-1 tw-text-sm tw-leading-6 tw-text-rose-300"
    >
      {report.revoked > 0 ? (
        <p className="tw-m-0 tw-text-iron-300">
          {tCount(
            locale,
            {
              one: "devicesSecurity.cleanUp.done.one",
              other: "devicesSecurity.cleanUp.done.other",
            },
            report.revoked
          )}
        </p>
      ) : null}
      {report.failed.length > 0 ? (
        <p className="tw-m-0">
          {t(locale, "devicesSecurity.cleanUp.failed", {
            labels: formatList(locale, report.failed),
          })}
        </p>
      ) : null}
      {report.changed.length > 0 ? (
        <p className="tw-m-0">
          {t(locale, "devicesSecurity.cleanUp.changed", {
            labels: formatList(locale, report.changed),
          })}
        </p>
      ) : null}
      {report.notAttempted.length > 0 ? (
        <p className="tw-m-0">
          {t(locale, "devicesSecurity.cleanUp.notAttempted", {
            labels: formatList(locale, report.notAttempted),
          })}
        </p>
      ) : null}
      {report.stopped ? (
        <p className="tw-m-0">
          {t(locale, "devicesSecurity.cleanUp.modeChanged")}
        </p>
      ) : null}
    </div>
  );
}

/**
 * One reviewed revoke for earlier setups of this browser. The devices listed
 * when it opens are pre-selected (mount it per opening, with a key); the
 * user can keep any of them, and one that becomes eligible later is listed
 * unselected. Revokes run one after another, each only while the device,
 * and whether revokes are signed here, are still what was confirmed;
 * anything else stays listed for a new confirm.
 */
export function CleanUpDialog({
  devices,
  findActive,
  open,
  signed,
  onRevoke,
  onClose,
  onDone,
}: {
  readonly devices: readonly SecurityDevice[];
  /** The device with this id while it is still active anywhere in the tab. */
  readonly findActive: (id: string) => SecurityDevice | null;
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
  const [report, setReport] = useState<BatchReport>(NO_REPORT);
  // The current list: a device no longer eligible drops out.
  const selected = devices.filter((device) => chosen.has(device.id));
  const deletesChats =
    signed &&
    selected.some((device) => device.encryptedDms?.status === "active");
  // The list, signing mode and handler of the latest committed render, read
  // together before each revoke of a batch: they can change while earlier
  // ones run. Set during the commit (a layout effect), before any revoke's
  // continuation can read it.
  const latest = useRef({ devices, findActive, signed, onRevoke });
  useLayoutEffect(() => {
    latest.current = { devices, findActive, signed, onRevoke };
  });

  const close = () => {
    if (pending) {
      return;
    }
    setReport(NO_REPORT);
    onClose();
  };

  const confirm = async () => {
    setPending(true);
    setReport(NO_REPORT);
    // One at a time on purpose: each failure is named, and revokes never
    // race each other through the engine.
    const outcome = await selected.reduce<Promise<BatchReport>>(
      async (previous, confirmed) => {
        const progress = await previous;
        const now = latest.current;
        if (progress.stopped || now.signed !== signed) {
          // Signed or not decides what happens to saved chats: the user
          // confirmed the other way.
          return { ...progress, stopped: true };
        }
        const device = now.devices.find((item) => item.id === confirmed.id);
        if (!device) {
          // Ended meanwhile: nothing left to revoke. Still active but no
          // longer an earlier setup: named, so the user can find it.
          const active = now.findActive(confirmed.id);
          return active
            ? {
                ...progress,
                notAttempted: [...progress.notAttempted, active.label],
              }
            : progress;
        }
        if (revokeScope(device) !== revokeScope(confirmed)) {
          return { ...progress, changed: [...progress.changed, device.label] };
        }
        try {
          await now.onRevoke(device);
          return { ...progress, revoked: progress.revoked + 1 };
        } catch {
          return { ...progress, failed: [...progress.failed, device.label] };
        }
      },
      Promise.resolve(NO_REPORT)
    );
    setPending(false);
    if (needsReview(outcome)) {
      setReport(outcome);
      return;
    }
    onClose();
    onDone(outcome.revoked);
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
          <Button
            variant="secondary"
            size="md"
            onClick={close}
            disabled={pending}
          >
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
      <fieldset
        className={`tw-m-0 tw-min-w-0 tw-border-0 tw-p-0 ${E2EE_DIALOG_SCROLL_REGION}`}
      >
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
      <CleanUpReport report={report} />
    </E2eeDialog>
  );
}
