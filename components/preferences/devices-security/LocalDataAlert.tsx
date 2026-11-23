"use client";

import { useState } from "react";
import { E2eeConfirmDialog } from "@/components/e2ee/ui/E2eeConfirmDialog";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { LeftoverLocalData } from "./useSecurityDevices";

/**
 * This browser's encrypted device was revoked without a signature it could
 * verify, so its chats are still saved here. They are removed only when the
 * user asks, after a confirmation, and only while that device is still the
 * one stored here.
 */
export function LocalDataAlert({
  leftover,
  onRemove,
}: {
  readonly leftover: LeftoverLocalData | null;
  readonly onRemove: (deviceKey: string) => Promise<boolean>;
}) {
  const locale = useBrowserLocale();
  const [confirming, setConfirming] = useState(false);
  if (!leftover) {
    return null;
  }
  return (
    <div className="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-amber-500/30 tw-bg-amber-500/10 tw-p-3 tw-text-sm tw-text-amber-100 sm:tw-flex-row sm:tw-items-center">
      <p className="tw-m-0 tw-flex-1">
        {t(locale, "devicesSecurity.localData.body", {
          label: leftover.label,
        })}
      </p>
      <Button
        variant="destructiveOutline"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        {t(locale, "devicesSecurity.localData.remove")}
      </Button>
      <E2eeConfirmDialog
        open={confirming}
        title={t(locale, "e2ee.enroll.removeLocalTitle")}
        body={t(locale, "e2ee.enroll.removeLocalBody")}
        confirmLabel={t(locale, "e2ee.enroll.removeLocalConfirm")}
        destructive
        errorFallbackKey="e2ee.enroll.removeLocalFailed"
        onConfirm={async () => {
          await onRemove(leftover.deviceKey);
        }}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}
