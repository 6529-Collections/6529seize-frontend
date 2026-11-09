"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { showAppToast } from "@/components/utils/toast/AppToast";
import { DEFAULT_LOCALE, getBrowserLocale } from "@/i18n/locales";
import { hasLocaleMessages, t } from "@/i18n/messages";
import { subscribeToDeviceGrantChanges } from "@/lib/device-signing/device-key-store";
import { revokeLostDeviceGrant } from "@/lib/device-signing/replace-lost-grant";
import type { QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/** The locale for a toast shown now, outside rendering. */
const currentLocale = () => {
  const locale = getBrowserLocale();
  return hasLocaleMessages(locale) ? locale : DEFAULT_LOCALE;
};

/**
 * After this browser lost its key store and signs a new grant, revokes the
 * grant it held before and says so briefly. Only for the signed-in account
 * (its own wallet and profile, not a proxy): a loss recorded for another
 * account stays pending until that account signs in. Also retries when the
 * account signs in or the page loads, for an earlier attempt that failed on
 * the network.
 */
export function useLostDeviceGrantCleanup(
  queryClient: QueryClient,
  wallet: string | null,
  profileId: string | null
): void {
  useEffect(() => {
    if (!wallet || !profileId) {
      return;
    }
    const account = { wallet: wallet.toLowerCase(), profileId };
    let active = true;
    const cleanUp = () => {
      void revokeLostDeviceGrant(account).then((result) => {
        if (!active || result === "none") {
          return;
        }
        void queryClient.invalidateQueries({
          queryKey: [QueryKey.DEVICE_GRANTS],
        });
        if (result === "revoked") {
          showAppToast({
            type: "success",
            message: t(
              currentLocale(),
              "signedMessages.notice.restore.replaced"
            ),
          });
        }
      });
    };
    cleanUp();
    const unsubscribe = subscribeToDeviceGrantChanges(({ address, saved }) => {
      if (saved && address === account.wallet) {
        cleanUp();
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [queryClient, wallet, profileId]);
}
