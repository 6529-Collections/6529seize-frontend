"use client";

import { useState } from "react";
import Button from "@/components/utils/button/Button";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import { getE2eeActionErrorKey, isE2eeSignatureRejection } from "../e2eeErrors";
import { E2eeBanner } from "../ui/E2eeBanner";
import { useE2eeNow } from "../useE2eeNow";

/** Renewal opens in the grant's last 14 days (contract 8.8). */
const E2EE_RENEWAL_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Non-modal renewal prompt for this device's grant. Callers render it only
 * when the user is not mid-message (for example, an empty composer).
 */
export function E2eeRenewalBanner({
  className = "",
}: {
  readonly className?: string | undefined;
}) {
  const locale = useBrowserLocale();
  const { engine, thisDevice, status } = useE2ee();
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const now = useE2eeNow();

  if (status !== "ready" || !engine || !thisDevice) {
    return null;
  }
  const remaining = thisDevice.expiresAt - now;
  const expiryDate = formatDate(locale, thisDevice.expiresAt);
  if (remaining > E2EE_RENEWAL_WINDOW_MS) {
    return null;
  }

  const renew = async () => {
    setPending(true);
    setErrorKey(null);
    try {
      await engine.enroll();
    } catch (error) {
      // Declining is a choice: access simply continues until it ends.
      setErrorKey(
        isE2eeSignatureRejection(error)
          ? "e2ee.renew.rejected"
          : getE2eeActionErrorKey(error, "e2ee.renew.failed")
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <E2eeBanner
      tone="info"
      live={false}
      className={className}
      action={
        <Button
          variant="secondary"
          size="xs"
          loading={pending}
          onClick={() => void renew()}
        >
          {t(locale, "e2ee.renew.button")}
        </Button>
      }
    >
      <span>{t(locale, "e2ee.renew.body", { date: expiryDate })}</span>
      {errorKey ? (
        <span
          role={errorKey === "e2ee.renew.rejected" ? "status" : "alert"}
          className={`tw-mt-1 tw-block ${
            errorKey === "e2ee.renew.rejected"
              ? "tw-text-iron-300"
              : "tw-text-rose-300"
          }`}
        >
          {t(locale, errorKey, { date: expiryDate })}
        </span>
      ) : null}
    </E2eeBanner>
  );
}
