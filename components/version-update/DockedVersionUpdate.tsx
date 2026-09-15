"use client";

import { useVersionStatus } from "@/contexts/VersionStatusContext";
import { refreshAppVersion } from "@/helpers/version-refresh.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

import DockUpdateSurface from "./DockUpdateSurface";

export default function DockedVersionUpdate({
  compact,
  dockClassName,
}: {
  readonly compact: boolean;
  readonly dockClassName: string;
}) {
  const isVersionStale = useVersionStatus();
  if (!isVersionStale) return null;

  return (
    <>
      <DockUpdateSurface dockClassName={dockClassName} />
      <div
        data-version-update-dock={compact ? "compact" : "expanded"}
        className={`tw-pointer-events-none tw-absolute tw-bottom-full tw-left-1/2 tw-z-10 -tw-translate-x-1/2 tw-transition-[width,height] tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none ${compact ? "tw-h-[31.68px] tw-w-[91.52px] sm:tw-h-9 sm:tw-w-[104px]" : "tw-h-9 tw-w-[104px]"}`}
      >
        <VersionUpdateButton
          className={`tw-absolute tw-left-1/2 tw-top-0.5 tw-origin-top -tw-translate-x-1/2 tw-transition-transform tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none ${compact ? "tw-scale-[0.88] sm:tw-scale-100" : "tw-scale-100"}`}
        />
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
