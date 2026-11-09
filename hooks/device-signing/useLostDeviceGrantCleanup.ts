"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { showAppToast } from "@/components/utils/toast/AppToast";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { subscribeToDeviceGrantChanges } from "@/lib/device-signing/device-key-store";
import { revokeLostDeviceGrant } from "@/lib/device-signing/replace-lost-grant";
import type { QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * After this browser lost its key store and signs a new grant, revokes the
 * grant it held before and says so briefly.
 */
export function useLostDeviceGrantCleanup(queryClient: QueryClient): void {
  const locale = useBrowserLocale();
  useEffect(
    () =>
      subscribeToDeviceGrantChanges(({ address, saved }) => {
        if (!saved) {
          return;
        }
        void revokeLostDeviceGrant(address).then((revoked) => {
          if (!revoked) {
            return;
          }
          void queryClient.invalidateQueries({
            queryKey: [QueryKey.DEVICE_GRANTS],
          });
          showAppToast({
            type: "success",
            message: t(locale, "signedMessages.notice.restore.replaced"),
          });
        });
      }),
    [locale, queryClient]
  );
}
