"use client";

import NetworkHealthCTA from "@/components/header/NetworkHealthCTA";
import HeaderSearchButton from "@/components/header/header-search/HeaderSearchButton";
import HeaderPageShareButton from "@/components/header/share/HeaderPageShareButton";
import { isPageShareSupported } from "@/components/header/share/page-share-support";
import EnvironmentBadge from "@/components/common/EnvironmentBadge";
import { getActiveViewFromUrl } from "@/components/navigation/ViewContext";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface SmallScreenHeaderProps {
  readonly interactive?: boolean;
  readonly onMenuToggle: () => void;
  readonly isMenuOpen: boolean;
}

function SmallScreenPageShareButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeWaveId = getActiveWaveIdFromUrl({ pathname, searchParams });
  const activeView = getActiveViewFromUrl({ activeWaveId, searchParams });

  if (!isPageShareSupported({ activeView, pathname, surface: "mobile" })) {
    return null;
  }

  return <HeaderPageShareButton isCapacitor={false} />;
}

export default function SmallScreenHeader({
  interactive = true,
  onMenuToggle,
  isMenuOpen,
}: SmallScreenHeaderProps) {
  const pathname = usePathname();
  const isHomeRoute = pathname === "/";
  const locale = useBrowserLocale();

  return (
    <header
      aria-busy={!interactive}
      className="tailwind-scope tw-sticky tw-top-0 tw-z-50 tw-flex-shrink-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-black"
    >
      <div className="tw-flex tw-h-16 tw-items-center tw-justify-between tw-px-5">
        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
          <Link href="/" className="tw-flex tw-items-center">
            <Image
              unoptimized
              loading="eager"
              priority
              alt="6529Seize"
              src="/6529.svg"
              className="tw-h-10 tw-w-10 tw-flex-shrink-0 tw-transition-all tw-duration-100 desktop-hover:hover:tw-scale-[1.02] desktop-hover:hover:tw-shadow-[0_0_20px_10px_rgba(255,215,215,0.3)]"
              width={40}
              height={40}
            />
          </Link>
          <EnvironmentBadge compact />
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          {isHomeRoute && <NetworkHealthCTA />}
          {interactive && (
            <Suspense fallback={null}>
              <SmallScreenPageShareButton />
            </Suspense>
          )}
          {interactive ? (
            <HeaderSearchButton wave={null} />
          ) : (
            <output
              aria-label={t(locale, "header.navigation.loading")}
              className="tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-text-iron-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700"
            >
              <span
                aria-hidden="true"
                className="tw-size-5 tw-rounded-full tw-border-2 tw-border-solid tw-border-iron-600 tw-border-t-iron-300 motion-safe:tw-animate-spin"
              />
              <span className="tw-sr-only">
                {t(locale, "header.navigation.loading")}
              </span>
            </output>
          )}
          <button
            disabled={!interactive}
            onClick={onMenuToggle}
            className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-text-iron-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-iron-50"
            aria-label={t(
              locale,
              isMenuOpen ? "header.menu.close" : "header.menu.open"
            )}
          >
            <Bars3Icon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300" />
          </button>
        </div>
      </div>
    </header>
  );
}
