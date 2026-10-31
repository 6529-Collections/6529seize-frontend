"use client";

import { useAuth } from "@/components/auth/Auth";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useCallback, useState } from "react";

/**
 * "Turn on signed messages": signs in again so the challenge grants this
 * browser's key (one wallet signature). Sign-in reports its own failures.
 */
export function useEnableSignedMessages() {
  const locale = useBrowserLocale();
  const { requestSignedMessagesGrant, setToast } = useAuth();
  const [isEnabling, setIsEnabling] = useState(false);

  const enable = useCallback(async () => {
    if (!requestSignedMessagesGrant || isEnabling) {
      return;
    }
    setIsEnabling(true);
    try {
      const { success } = await requestSignedMessagesGrant();
      if (success) {
        setToast({
          message: t(locale, "signedMessages.notice.enabled"),
          type: "success",
        });
      }
    } finally {
      setIsEnabling(false);
    }
  }, [isEnabling, locale, requestSignedMessagesGrant, setToast]);

  return {
    canEnable: requestSignedMessagesGrant !== undefined,
    enable,
    isEnabling,
  };
}
