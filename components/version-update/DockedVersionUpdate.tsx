"use client";

import type { ReactNode } from "react";
import { useVersionStatus } from "@/contexts/VersionStatusContext";
import { refreshAppVersion } from "@/helpers/version-refresh.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

import DockUpdateSurface from "./DockUpdateSurface";

export default function DockedVersionUpdate({
  children,
}: {
  readonly children?: ReactNode;
}) {
  const isVersionStale = useVersionStatus();
  if (!isVersionStale) {
    return children !== undefined && children !== null ? (
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-overflow-hidden tw-rounded-[inherit]">
        {children}
      </div>
    ) : null;
  }

  return (
    <>
      <DockUpdateSurface>{children}</DockUpdateSurface>
      <div
        data-version-update-dock="true"
        className="tw-pointer-events-none tw-absolute tw-bottom-full tw-left-1/2 tw-z-10 -tw-translate-x-1/2"
        style={{
          width: "calc(104px * var(--dock-update-scale))",
          height: "calc(36px * var(--dock-update-scale))",
        }}
      >
        <VersionUpdateButton className="tw-absolute tw-left-1/2 tw-top-[calc(2px*var(--dock-update-scale))] tw-origin-top -tw-translate-x-1/2 tw-scale-[var(--dock-update-scale)]" />
      </div>
    </>
  );
}

export function VersionUpdateButton({
  className = "",
}: {
  readonly className?: string;
}) {
  const locale = useBrowserLocale();
  return (
    <button
      type="button"
      aria-label={t(locale, "newVersionToast.updateAction")}
      title={t(locale, "newVersionToast.updateAction")}
      onClick={refreshAppVersion}
      className={`tw-pointer-events-auto tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-1 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#95ffad] active:tw-opacity-70 desktop-hover:hover:tw-opacity-80 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Cache the same local asset used by the pre-hydration reload screen. */}
      <img
        src="/rocket-refresh-small.png"
        alt=""
        width={28}
        height={28}
        className="tw-size-7 tw-object-contain"
      />
    </button>
  );
}
