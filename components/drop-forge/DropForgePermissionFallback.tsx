"use client";

import DropForgeNoPower from "@/components/drop-forge/DropForgeNoPower";
import type { ComponentType, ReactNode } from "react";

export function DropForgePermissionFallback({
  title,
  permissionsLoading,
  hasWallet,
  hasAccess,
  titleIcon: TitleIcon,
  titleRight,
}: Readonly<{
  title: string;
  permissionsLoading: boolean;
  hasWallet: boolean;
  hasAccess: boolean;
  titleIcon?: ComponentType<{ className?: string | undefined }> | undefined;
  titleRight?: ReactNode;
}>) {
  if (!permissionsLoading && hasWallet && hasAccess) return null;

  return (
    <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
      <div className="tw-mb-4 tw-flex tw-items-start tw-justify-between tw-gap-3">
        <h1 className="tw-mb-0 tw-inline-flex tw-items-center tw-gap-3 tw-text-3xl tw-font-semibold tw-text-iron-50">
          {TitleIcon ? <TitleIcon className="tw-h-8 tw-w-8 tw-flex-shrink-0" /> : null}
          {title}
        </h1>
        {titleRight ?? null}
      </div>
      {permissionsLoading ? (
        <p className="tw-mb-0 tw-text-iron-400">Checking permissions…</p>
      ) : (
        <DropForgeNoPower />
      )}
    </div>
  );
}
