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

type UserPageXtdhProps = {
  readonly profile: ApiIdentity;
};

export default function UserPageXtdh({ profile }: UserPageXtdhProps) {
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
    },
    [activeFilter, pathname, router, searchParams]
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
        <div className="tw-flex tw-flex-col tw-items-stretch tw-justify-between tw-overflow-hidden tw-rounded-t-xl tw-border tw-border-b-0 tw-border-solid tw-border-iron-800 tw-bg-iron-950/80 tw-p-1 md:tw-flex-row md:tw-items-center">
          <div className="tw-grid tw-w-full tw-grid-cols-2 tw-gap-1 md:tw-flex md:tw-w-auto">
            {XTDH_TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleFilterChange(tab.key)}
                  className={`tw-relative tw-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border-t-0 tw-border-x-0 tw-border-b-2 tw-px-3 tw-py-3 tw-text-sm tw-font-medium tw-transition-all tw-duration-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 sm:tw-px-8 md:tw-w-auto ${
                    isActive
                      ? "tw-text-white tw-bg-iron-900 tw-border-b-primary-400"
                      : "tw-text-iron-400 desktop-hover:hover:tw-text-white desktop-hover:hover:tw-bg-iron-800/50 tw-border-b-transparent tw-bg-transparent"
                  }`}
                >
                  <Icon className="tw-size-4 tw-shrink-0" />
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
