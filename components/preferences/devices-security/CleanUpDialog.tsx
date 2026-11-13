"use client";

import { useId, useState } from "react";
import {
  E2EE_DIALOG_SCROLL_REGION,
  E2eeDialog,
} from "@/components/e2ee/ui/E2eeDialog";
import { tCount } from "@/components/e2ee/e2eeFormat";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatList } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { SecurityDevice } from "./classifyDevices";
import { DeviceMeta, formatDeviceWithPermissions } from "./DeviceParts";

/**
 * One reviewed revoke for earlier setups of this browser. Every device is
 * listed with its dates and pre-selected; the user can keep any of them.
 * Revokes run one after another and failures are named.
 */
export function CleanUpDialog({
  devices,
  open,
  onRevoke,
  onClose,
  onDone,
}: {
  readonly devices: readonly SecurityDevice[];
  readonly open: boolean;
  readonly onRevoke: (device: SecurityDevice) => Promise<void>;
  readonly onClose: () => void;
  readonly onDone: (revoked: number) => void;
}) {
  const locale = useBrowserLocale();
  const listId = useId();
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [failedLabels, setFailedLabels] = useState<readonly string[]>([]);
  const selected = devices.filter((device) => !skipped.has(device.id));

  const close = () => {
    if (pending) {
      return;
    }
    setSkipped(new Set());
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
      async (previous, device) => {
        const outcome = await previous;
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
    setSkipped(new Set());
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
                  checked={!skipped.has(device.id)}
                  disabled={pending}
                  onChange={(event) => {
                    const keep = !event.target.checked;
                    setSkipped((current) => {
                      const next = new Set(current);
                      if (keep) {
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
