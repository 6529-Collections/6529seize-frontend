"use client";

import { DropForgeLaunchClaimHeader } from "@/components/drop-forge/launch/view/common";
import DropForgeLaunchClaimContent from "@/components/drop-forge/launch/view/LaunchClaimContent";
import type { DropForgeLaunchClaimPageViewProps } from "@/components/drop-forge/launch/view/types";

export { DropForgeLaunchClaimPermissionFallbackView } from "@/components/drop-forge/launch/view/common";

export function DropForgeLaunchClaimPageView({
  pageTitle,
  craftHref,
  loading,
  error,
  rootsError,
  ...contentProps
}: Readonly<DropForgeLaunchClaimPageViewProps>) {
  return (
    <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
      <DropForgeLaunchClaimHeader pageTitle={pageTitle} craftHref={craftHref} />
      {loading && <p className="tw-text-iron-400">Loading…</p>}
      {error && (
        <p className="tw-text-red-400 tw-mb-4" role="alert">
          {error}
        </p>
      )}
      {rootsError && (
        <p className="tw-text-red-400 tw-mb-4" role="alert">
          {rootsError}
        </p>
      )}
      <DropForgeLaunchClaimContent {...contentProps} />
    </div>
  );
}
