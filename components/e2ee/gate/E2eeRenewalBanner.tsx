"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { GRANT_RENEWAL_WINDOW_MS } from "@/lib/device-signing/device-key-store";
import { useState } from "react";
import Button from "@/components/utils/button/Button";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import { getE2eeActionErrorKey, isE2eeSignatureRejection } from "../e2eeErrors";
import { E2eeBanner } from "../ui/E2eeBanner";
import { useE2eeNow } from "../useE2eeNow";

/**
 * Non-modal renewal prompt for this device's grant. Callers render it only
 * when the user is not mid-message (for example, an empty composer).
 */
export function E2eeRenewalBanner({
  className = "",
  inboxReminder = false,
}: {
  readonly className?: string | undefined;
  readonly inboxReminder?: boolean | undefined;
}) {
  const locale = useBrowserLocale();
  const { engine, thisDevice, status } = useE2ee();
  const [dismissedReminder, setDismissedReminder] = useState<string | null>(
    null
  );
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const now = useE2eeNow();

  if (status !== "ready" || !engine || !thisDevice) {
    return null;
  }
  const remaining = thisDevice.expiresAt - now;
  const expiryDate = formatDate(locale, thisDevice.expiresAt);
  const reminder = `${thisDevice.deviceKey}:${thisDevice.expiresAt}`;
  if (
    now === 0 ||
    remaining > GRANT_RENEWAL_WINDOW_MS ||
    (inboxReminder && (remaining <= 0 || dismissedReminder === reminder))
  ) {
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
      tone={inboxReminder ? "warning" : "info"}
      live={false}
      className={className}
      action={
        <>
          <Button
            variant="secondary"
            size="xs"
            loading={pending}
            onClick={() => void renew()}
          >
            {t(
              locale,
              inboxReminder ? "e2ee.renew.inboxButton" : "e2ee.renew.button"
            )}
          </Button>
          {inboxReminder && (
            <Button
              variant="secondary"
              size="xs"
              aria-label={t(locale, "e2ee.renew.dismiss")}
              disabled={pending}
              onClick={() => setDismissedReminder(reminder)}
            >
              <XMarkIcon aria-hidden="true" className="tw-size-4" />
            </Button>
          )}
        </>
      }
    >
      <span>
        {t(
          locale,
          inboxReminder && thisDevice.linkedAuthorProof
            ? "e2ee.renew.inboxCombined"
            : "e2ee.renew.body",
          { date: expiryDate }
        )}
      </span>
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
