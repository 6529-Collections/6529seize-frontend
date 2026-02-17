"use client";

import {
  DROP_CONTROL_SECTIONS,
  DROP_CONTROL_TITLE,
} from "@/components/drop-control/drop-control.constants";
import { DropControlPermissionFallback } from "@/components/drop-control/DropControlPermissionFallback";
import DropControlTestnetIndicator from "@/components/drop-control/DropControlTestnetIndicator";
import { useDropControlPermissions } from "@/hooks/useDropControlPermissions";
import {
  RocketLaunchIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function DropControlPageClient() {
  const {
    hasWallet,
    permissionsLoading,
    canAccessLanding,
    canAccessPrepare,
    canAccessLaunch,
  } = useDropControlPermissions();

  const permissionFallback = DropControlPermissionFallback({
    title: DROP_CONTROL_TITLE,
    permissionsLoading,
    hasWallet,
    hasAccess: canAccessLanding,
  });

  if (permissionFallback) {
    return permissionFallback;
  }

  return (
    <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
      <DropControlTestnetIndicator />
      <h1 className="tw-mb-8 tw-text-3xl tw-font-semibold tw-text-iron-50">
        {DROP_CONTROL_TITLE}
      </h1>
      <div className="tw-grid tw-grid-cols-1 tw-gap-6 sm:tw-grid-cols-2">
        <Link
          href={DROP_CONTROL_SECTIONS.PREPARE.path}
          className={`tw-group tw-relative tw-flex tw-min-h-[20rem] tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-rounded-xl tw-px-4 tw-py-6 tw-text-center tw-no-underline tw-ring-1 tw-ring-inset tw-transition-all tw-duration-300 ${
            canAccessPrepare
              ? "tw-cursor-pointer tw-bg-iron-950 tw-ring-iron-800 hover:tw-bg-iron-900 hover:tw-ring-iron-600"
              : "tw-cursor-not-allowed tw-bg-black/90 tw-ring-iron-900"
          }`}
          onClick={(e) => {
            if (!canAccessPrepare) e.preventDefault();
          }}
          aria-disabled={!canAccessPrepare}
        >
          <div
            className={`tw-flex tw-h-16 tw-w-16 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-text-iron-300 ${
              canAccessPrepare
                ? "group-hover:tw-bg-iron-700 group-hover:tw-text-iron-100"
                : ""
            }`}
          >
            <WrenchScrewdriverIcon className="tw-h-10 tw-w-10" />
          </div>
          <h2 className="tw-mb-0 tw-mt-4 tw-text-xl tw-font-semibold tw-text-iron-50">
            {DROP_CONTROL_SECTIONS.PREPARE.title}
          </h2>
          <p className="tw-my-0 tw-text-sm tw-leading-relaxed tw-text-iron-400">
            {DROP_CONTROL_SECTIONS.PREPARE.description}
          </p>
        </Link>

        <Link
          href={DROP_CONTROL_SECTIONS.LAUNCH.path}
          className={`tw-group tw-relative tw-flex tw-min-h-[20rem] tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-rounded-xl tw-px-4 tw-py-6 tw-text-center tw-no-underline tw-ring-1 tw-ring-inset tw-transition-all tw-duration-300 ${
            canAccessLaunch
              ? "tw-cursor-pointer tw-bg-iron-950 tw-ring-iron-800 hover:tw-bg-iron-900 hover:tw-ring-iron-600"
              : "tw-cursor-not-allowed tw-bg-black/90 tw-ring-iron-900"
          }`}
          onClick={(e) => {
            if (!canAccessLaunch) e.preventDefault();
          }}
          aria-disabled={!canAccessLaunch}
        >
          <div
            className={`tw-flex tw-h-16 tw-w-16 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-text-iron-300 ${
              canAccessLaunch
                ? "group-hover:tw-bg-iron-700 group-hover:tw-text-iron-100"
                : ""
            }`}
          >
            <RocketLaunchIcon className="tw-h-10 tw-w-10" />
          </div>
          <h2 className="tw-mb-0 tw-mt-4 tw-text-xl tw-font-semibold tw-text-iron-50">
            {DROP_CONTROL_SECTIONS.LAUNCH.title}
          </h2>
          <p className="tw-my-0 tw-text-sm tw-leading-relaxed tw-text-iron-400">
            {DROP_CONTROL_SECTIONS.LAUNCH.description}
          </p>
        </Link>
      </div>
    </div>
  );
}
