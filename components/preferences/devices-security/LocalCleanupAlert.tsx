"use client";

import { useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { LocalCleanup } from "./useSecurityDevices";

interface FailedCleanup {
  readonly deviceKey: string;
  readonly label: string;
}

/**
 * A revoke that went through but couldn't remove this browser's encrypted
 * data: remembered here so the removal can be retried on its own, without
 * revoking again.
 */
export function useLocalCleanupFailure(
  retry: (deviceKey: string) => Promise<boolean>
) {
  const [failed, setFailed] = useState<FailedCleanup | null>(null);
  const [retryFailed, setRetryFailed] = useState(false);
  return {
    failed,
    retryFailed,
    report: (outcome: LocalCleanup, label: string) => {
      if (outcome.kind === "failed") {
        setRetryFailed(false);
        setFailed({ deviceKey: outcome.deviceKey, label });
      }
    },
    retry: async () => {
      if (!failed) {
        return;
      }
      try {
        await retry(failed.deviceKey);
        setFailed(null);
      } catch {
        setRetryFailed(true);
      }
    },
  };
}

export function LocalCleanupAlert({
  state,
}: {
  readonly state: ReturnType<typeof useLocalCleanupFailure>;
}) {
  const locale = useBrowserLocale();
  const [pending, setPending] = useState(false);
  if (!state.failed) {
    return null;
  }
  return (
    <div
      role="alert"
      className="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-amber-500/30 tw-bg-amber-500/10 tw-p-3 tw-text-sm tw-text-amber-100 sm:tw-flex-row sm:tw-items-center"
    >
      <p className="tw-m-0 tw-flex-1">
        {t(
          locale,
          state.retryFailed
            ? "devicesSecurity.localCleanup.retryFailed"
            : "devicesSecurity.localCleanup.failed",
          { label: state.failed.label }
        )}
      </p>
      <Button
        variant="secondary"
        size="sm"
        loading={pending}
        onClick={() => {
          setPending(true);
          void state.retry().finally(() => setPending(false));
        }}
      >
        {t(locale, "devicesSecurity.localCleanup.retry")}
      </Button>
    </div>
  );
}
