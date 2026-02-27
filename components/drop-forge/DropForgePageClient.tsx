"use client";

import Link from "next/link";
import DropForgeCraftIcon from "@/components/common/icons/DropForgeCraftIcon";
import DropForgeLaunchIcon from "@/components/common/icons/DropForgeLaunchIcon";
import {
  DROP_FORGE_SECTIONS,
  DROP_FORGE_TITLE,
} from "@/components/drop-forge/drop-forge.constants";
import { DropForgePermissionFallback } from "@/components/drop-forge/DropForgePermissionFallback";
import DropForgeTestnetIndicator from "@/components/drop-forge/DropForgeTestnetIndicator";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";

export default function DropForgePageClient() {
  const {
    hasWallet,
    permissionsLoading,
    canAccessLanding,
    canAccessCraft,
    canAccessLaunch,
  } = useDropForgePermissions();

  if (permissionsLoading || !hasWallet || !canAccessLanding) {
    return (
      <DropForgePermissionFallback
        title={DROP_FORGE_TITLE}
        permissionsLoading={permissionsLoading}
        hasWallet={hasWallet}
        hasAccess={canAccessLanding}
      />
    );
  }

  return (
    <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
      <div className="tw-mb-8 tw-flex tw-items-center tw-justify-between tw-gap-3">
        <h1 className="tw-mb-0 tw-text-3xl tw-font-semibold tw-text-iron-50">
          {DROP_FORGE_TITLE}
        </h1>
        <DropForgeTestnetIndicator className="tw-flex-shrink-0" />
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-6 sm:tw-grid-cols-2">
        <Link
          href={DROP_FORGE_SECTIONS.CRAFT.path}
          className={`tw-group tw-relative tw-flex tw-min-h-[14rem] sm:tw-min-h-[20rem] tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-rounded-xl tw-px-4 tw-py-6 tw-text-center tw-no-underline tw-ring-1 tw-ring-inset tw-transition-all tw-duration-300 ${
            canAccessCraft
              ? "tw-cursor-pointer tw-bg-iron-950 tw-ring-iron-800 hover:tw-bg-iron-900 hover:tw-ring-iron-600"
              : "tw-cursor-not-allowed tw-bg-black/90 tw-ring-iron-900"
          }`}
          onClick={(e) => {
            if (!canAccessCraft) e.preventDefault();
          }}
          aria-disabled={!canAccessCraft}
        >
          <div
            className={`tw-flex tw-h-12 tw-w-12 sm:tw-h-16 sm:tw-w-16 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-text-iron-300 ${
              canAccessCraft
                ? "group-hover:tw-bg-iron-700 group-hover:tw-text-iron-100"
                : ""
            }`}
          >
            <DropForgeCraftIcon className="tw-h-8 tw-w-8 sm:tw-h-10 sm:tw-w-10" />
          </div>
          <h2 className="tw-mb-0 tw-mt-4 tw-text-xl tw-font-semibold tw-text-iron-50">
            {DROP_FORGE_SECTIONS.CRAFT.title}
          </h2>
          <p className="tw-my-0 tw-leading-relaxed tw-text-iron-300">
            {DROP_FORGE_SECTIONS.CRAFT.description}
          </p>
        </Link>

        <Link
          href={DROP_FORGE_SECTIONS.LAUNCH.path}
          className={`tw-group tw-relative tw-flex tw-min-h-[14rem] sm:tw-min-h-[20rem] tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-rounded-xl tw-px-4 tw-py-6 tw-text-center tw-no-underline tw-ring-1 tw-ring-inset tw-transition-all tw-duration-300 ${
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
            className={`tw-flex tw-h-12 tw-w-12 sm:tw-h-16 sm:tw-w-16 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-text-iron-300 ${
              canAccessLaunch
                ? "group-hover:tw-bg-iron-700 group-hover:tw-text-iron-100"
                : ""
            }`}
          >
            <DropForgeLaunchIcon className="tw-h-8 tw-w-8 sm:tw-h-10 sm:tw-w-10" />
          </div>
          <h2 className="tw-mb-0 tw-mt-4 tw-text-xl tw-font-semibold tw-text-iron-50">
            {DROP_FORGE_SECTIONS.LAUNCH.title}
          </h2>
          <p className="tw-my-0 tw-leading-relaxed tw-text-iron-300">
            {DROP_FORGE_SECTIONS.LAUNCH.description}
          </p>
        </Link>
      </div>
    </div>
  );
}
