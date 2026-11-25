"use client";

import PillTab from "@/components/common/PillTab";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  COMPACT_ACTION_BUTTON_CLASS,
  COMPACT_ACTION_CONTENT_CLASS,
  COMPACT_ACTION_TOUCH_TARGET_CLASS,
} from "@/components/utils/button/compactActionButtonStyles";
import { useCallback, useContext, useMemo } from "react";
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
  PlusIcon,
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
  const locale = useBrowserLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const statsProfileId = useMemo(
    () => profile.query ?? profile.handle ?? profile.primary_wallet,
    [profile.handle, profile.primary_wallet, profile.query]
  );

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
      (!!connectedHandle &&
        !!profileHandle &&
        connectedHandle === profileHandle)
    );
  }, [
    activeProfileProxy,
    connectedProfile,
    profile.consolidation_key,
    profile.handle,
  ]);

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
    <div
      className="tailwind-scope tw-group/profile-xtdh tw-flex tw-flex-col tw-gap-6"
      data-typography="profile"
    >
      <UserXtdhTestModeBanner />
      <UserPageXtdhStatsHeader
        profileId={statsProfileId}
        onOutboundClick={canGrant ? handleOutboundClick : undefined}
      />

      <div className="tw-mt-2">
        <div className="tw-mb-3 tw-flex tw-items-center tw-gap-2">
          {XTDH_TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.key;
            return (
              <PillTab
                key={tab.key}
                active={isActive}
                aria-pressed={isActive}
                onClick={() => handleFilterChange(tab.key)}
                className={`!tw-gap-1.5 !tw-text-[13px] !tw-font-medium focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${isActive ? "!tw-bg-iron-800 !tw-text-white" : "!tw-text-iron-400 desktop-hover:hover:!tw-text-iron-200"}`}
              >
                <Icon
                  aria-hidden="true"
                  className="tw-size-3.5 tw-shrink-0 tw-opacity-70"
                />
                {tab.label}
              </PillTab>
            );
          })}
          {canGrant && (
            <button
              type="button"
              onClick={handleOutboundClick}
              className={`${COMPACT_ACTION_BUTTON_CLASS} ${COMPACT_ACTION_TOUCH_TARGET_CLASS} tw-ml-auto`}
            >
              <span
                className={`${COMPACT_ACTION_CONTENT_CLASS} max-md:tw-text-[13px]`}
              >
                <PlusIcon aria-hidden="true" className="tw-size-3.5" />
                {t(locale, "xtdh.grant.createAction")}
              </span>
            </button>
          )}
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
