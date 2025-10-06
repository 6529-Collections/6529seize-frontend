"use client";

import { useCallback, useContext, useEffect, useMemo } from "react";
import CommonSelect, {
  type CommonSelectItem,
} from "@/components/utils/select/CommonSelect";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { AuthContext } from "@/components/auth/Auth";
import UserPageXtdhGranted from "./UserPageXtdhGranted";
import UserPageXtdhReceived from "./UserPageXtdhReceived";

type XtdhViewFilter = "granted" | "received";

const DEFAULT_FILTER: XtdhViewFilter = "granted";

const XTDH_FILTER_ITEMS: CommonSelectItem<XtdhViewFilter>[] = [
  {
    key: "granted",
    label: "Granted",
    value: "granted",
  },
  {
    key: "received",
    label: "Received",
    value: "received",
  },
];

function parseFilter(value: string | null): XtdhViewFilter {
  if (!value) return DEFAULT_FILTER;
  const normalized = value.toLowerCase();
  return normalized === "received" ? "received" : DEFAULT_FILTER;
}

export default function UserPageXtdh({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const activeFilter = useMemo(
    () => parseFilter(searchParams?.get("tab") ?? null),
    [searchParams]
  );

  const canGrant = useMemo(() => {
    if (!connectedProfile) return false;
    if (activeProfileProxy) return false;
    const connectedHandle = connectedProfile.handle?.toLowerCase() ?? null;
    const profileHandle = profile.handle?.toLowerCase() ?? null;
    return (
      connectedProfile.consolidation_key === profile.consolidation_key ||
      (!!connectedHandle && !!profileHandle && connectedHandle === profileHandle)
    );
  }, [activeProfileProxy, connectedProfile, profile.consolidation_key, profile.handle]);

  useEffect(() => {
    if (!searchParams || !pathname) return;
    if (searchParams.has("tab")) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", DEFAULT_FILTER);
    const queryString = params.toString();

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  const handleFilterChange = useCallback(
    (filter: XtdhViewFilter) => {
      if (!searchParams || !pathname) return;

      if (activeFilter === filter) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", filter);

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [activeFilter, pathname, router, searchParams]
  );

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-gap-6">
      <div className="tw-w-full tw-overflow-x-auto horizontal-menu-hide-scrollbar">
        <CommonSelect
          items={XTDH_FILTER_ITEMS}
          activeItem={activeFilter}
          filterLabel="xTDH View"
          setSelected={handleFilterChange}
        />
      </div>

      {activeFilter === "granted" ? (
        <UserPageXtdhGranted
          canGrant={canGrant}
          grantor={
            profile.query ??
            profile.handle ??
            profile.primary_wallet ??
            profile.consolidation_key
          }
          isSelf={canGrant}
        />
      ) : (
        <UserPageXtdhReceived />
      )}
    </div>
  );
}
