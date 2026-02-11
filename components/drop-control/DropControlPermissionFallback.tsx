"use client";

import DropControlNoPower from "@/components/drop-control/DropControlNoPower";

export function DropControlPermissionFallback({
  title,
  permissionsLoading,
  hasWallet,
  hasAccess,
}: {
  title: string;
  permissionsLoading: boolean;
  hasWallet: boolean;
  hasAccess: boolean;
}) {
  if (!permissionsLoading && hasWallet && hasAccess) return null;

  return (
    <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
      <h1 className="tw-mb-4 tw-text-3xl tw-font-semibold tw-text-iron-50">
        {title}
      </h1>
      {permissionsLoading ? (
        <p className="tw-mb-0 tw-text-iron-400">Checking permissions…</p>
      ) : (
        <DropControlNoPower />
      )}
    </div>
  );
}

