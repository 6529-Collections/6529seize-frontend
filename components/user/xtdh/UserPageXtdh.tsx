"use client";

import { useCallback, useContext, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { AuthContext } from "@/components/auth/Auth";
import UserPageXtdhGranted from "./UserPageXtdhGranted";
import UserPageXtdhStatsHeader from "./UserPageXtdhStatsHeader";
import UserPageXtdhReceived from "@/components/xtdh/user/received";
import { UserXtdhTestModeBanner } from "./UserXtdhTestModeBanner";
import {
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
} from "@heroicons/react/24/outline";

type XtdhViewFilter = "granted" | "received";

const DEFAULT_FILTER: XtdhViewFilter = "granted";

const XTDH_TAB_CONFIG: {
  key: XtdhViewFilter;
  label: string;
  icon: typeof ArrowUpRightIcon;
}[] = [
  {
    key: "granted",
    label: "Granted",
    icon: ArrowUpRightIcon,
  },
  {
    key: "received",
    label: "Received",
    icon: ArrowDownLeftIcon,
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
  const statsProfileId = useMemo(() =>
    profile.query ??
    profile.handle ??
    profile.primary_wallet ??
    profile.consolidation_key ??
    null,
    [profile.consolidation_key, profile.handle, profile.primary_wallet, profile.query]);

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
    if (!pathname) return;
    if (searchParams?.has("tab")) return;

    const params = new URLSearchParams(searchParams?.toString());
    params.set("tab", DEFAULT_FILTER);
    const queryString = params.toString();

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  const handleFilterChange = useCallback(
    (filter: XtdhViewFilter) => {
      if (!pathname) return;

      if (activeFilter === filter) {
        return;
      }

      const params = new URLSearchParams(searchParams?.toString());
      params.set("tab", filter);

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [activeFilter, pathname, router]
  );

  const handleOutboundClick = useCallback(() => {
    const scrollToGrant = () => {
      const section = document.getElementById("create-grant-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
        const input = section.querySelector("input");
        if (input) {
          input.focus();
        }
      }
    };

    if (activeFilter !== "granted") {
      handleFilterChange("granted");
      // Wait for the tab change to render the grant form
      setTimeout(scrollToGrant, 100);
    } else {
      scrollToGrant();
    }
  }, [activeFilter, handleFilterChange]);

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-gap-6">
      <UserXtdhTestModeBanner />
      <UserPageXtdhStatsHeader
        profileId={statsProfileId}
        onOutboundClick={canGrant ? handleOutboundClick : undefined}
      />

      <div className="tw-mt-4">
        <div className="tw-border-b-0 tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-justify-between tw-rounded-t-lg tw-overflow-hidden">
          <div className="tw-flex tw-w-full md:tw-w-auto">
            {XTDH_TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleFilterChange(tab.key)}
                  className={`tw-relative tw-border-t-0 tw-border-x-0 tw-px-8 tw-py-5 tw-text-sm tw-font-medium tw-transition-all tw-duration-300 tw-flex tw-items-center tw-gap-2 tw-border-b-2 ${
                    isActive
                      ? "tw-text-white tw-bg-iron-900 tw-border-b-primary-400"
                      : "tw-text-iron-400 hover:tw-text-white hover:tw-bg-iron-800/50 tw-border-b-transparent tw-bg-transparent"
                  }`}
                >
                  <Icon className="tw-size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
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
          <UserPageXtdhReceived profileId={statsProfileId} />
        )}
      </div>
    </div>
  );
}
