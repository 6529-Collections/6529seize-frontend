"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { forgetDeviceGrant } from "@/lib/device-signing/device-key-store";
import {
  fetchDeviceGrants,
  revokeDeviceGrant,
} from "@/services/api/device-grants-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

/** Fetched on mount and at most every 10 minutes while the tab is visible. */
const DEVICE_GRANTS_REFRESH_MS = 10 * 60 * 1000;

const forgetRevokedLocalGrants = async (
  grants: readonly ApiDeviceGrant[]
): Promise<void> => {
  // Drops a local grant revoked from another device; other ids are no-ops.
  await Promise.all(
    grants
      .filter((grant) => grant.revoked_at !== null)
      .map((grant) => forgetDeviceGrant(grant.wallet, grant.id))
  );
};

/** The device grants of the signed-in profile (null address: disabled). */
export function useDeviceGrants(address: string | null) {
  const query = useQuery({
    queryKey: [QueryKey.DEVICE_GRANTS, address],
    queryFn: ({ signal }) => fetchDeviceGrants(signal),
    enabled: address !== null,
    staleTime: DEVICE_GRANTS_REFRESH_MS,
    refetchInterval: DEVICE_GRANTS_REFRESH_MS,
    refetchIntervalInBackground: false,
    retry: 1,
  });

  const grants = query.data;
  useEffect(() => {
    if (grants) {
      forgetRevokedLocalGrants(grants).catch(() => undefined);
    }
  }, [grants]);

  return query;
}

/** Revokes a grant, updates the cached list and reports the outcome. */
export function useRevokeDeviceGrant() {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (grant: ApiDeviceGrant) => revokeDeviceGrant(grant.id),
    onSuccess: async (revoked) => {
      queryClient.setQueriesData<ApiDeviceGrant[]>(
        { queryKey: [QueryKey.DEVICE_GRANTS] },
        (grants) =>
          grants?.map((grant) => (grant.id === revoked.id ? revoked : grant))
      );
      await forgetRevokedLocalGrants([revoked]).catch(() => undefined);
    },
  });

  const revoke = useCallback(
    async (grant: ApiDeviceGrant): Promise<boolean> => {
      try {
        await mutateAsync(grant);
        setToast({
          message: t(locale, "signedMessages.revoke.success", {
            label: grant.device_label,
          }),
          type: "success",
        });
        return true;
      } catch {
        setToast({
          message: t(locale, "signedMessages.revoke.error"),
          type: "error",
        });
        return false;
      }
    },
    [locale, mutateAsync, setToast]
  );

  return { revoke, isRevoking: isPending };
}
