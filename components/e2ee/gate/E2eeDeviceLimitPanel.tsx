"use client";

import { useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import type { E2eeDeviceInfo, E2eeEngine } from "@/lib/e2ee/types";
import { E2eeDeviceList } from "../devices/E2eeDeviceList";
import { getE2eeActionErrorKey, isE2eeSignatureRejection } from "../e2eeErrors";

/** Active devices per profile (contract 2.3; the engine reports the state). */
const E2EE_MAX_DEVICES = 10;

interface E2eeDeviceLimitPanelProps {
  readonly engine: E2eeEngine | null;
  readonly devices: readonly E2eeDeviceInfo[];
}

/** The profile has the maximum number of devices: revoke one to continue. */
export function E2eeDeviceLimitPanel({
  engine,
  devices,
}: E2eeDeviceLimitPanelProps) {
  const locale = useBrowserLocale();
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  const retry = async () => {
    if (!engine) {
      return;
    }
    setPending(true);
    setErrorKey(null);
    try {
      await engine.enroll();
    } catch (error) {
      setErrorKey(
        isE2eeSignatureRejection(error)
          ? "e2ee.enroll.rejected"
          : getE2eeActionErrorKey(error, "e2ee.enroll.failed")
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="tw-mx-auto tw-flex tw-w-full tw-max-w-3xl tw-flex-col tw-gap-4 tw-px-4 tw-py-6">
      <div>
        <h2 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          {t(locale, "e2ee.deviceLimit.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "e2ee.deviceLimit.body", {
            max: formatInteger(locale, E2EE_MAX_DEVICES),
          })}
        </p>
      </div>
      {devices.length > 0 ? (
        <section className="tw-flex tw-flex-col tw-gap-2">
          <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-200">
            {t(locale, "e2ee.deviceLimit.listTitle")}
          </h3>
          {/* Revoking is signed by an active device, so it happens there. */}
          <E2eeDeviceList devices={devices} engine={null} />
        </section>
      ) : null}
      <p className="tw-m-0 tw-text-xs tw-text-iron-400">
        {t(locale, "e2ee.deviceLimit.signature")}
      </p>
      <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center">
        <Button
          variant="action"
          size="md"
          onClick={() => void retry()}
          loading={pending}
          disabled={!engine}
        >
          {t(locale, "e2ee.deviceLimit.retry")}
        </Button>
        {errorKey ? (
          <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-300">
            {t(locale, errorKey)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
