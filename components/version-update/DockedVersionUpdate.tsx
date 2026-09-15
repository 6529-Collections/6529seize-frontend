"use client";

import { useVersionStatus } from "@/contexts/VersionStatusContext";
import { refreshAppVersion } from "@/helpers/version-refresh.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function DockedVersionUpdate({
  compact,
}: {
  readonly compact: boolean;
}) {
  const isVersionStale = useVersionStatus();
  const locale = useBrowserLocale();
  if (!isVersionStale) return null;

  return (
    <div
      className={`tw-pointer-events-none tw-absolute tw-bottom-[calc(100%-8px)] tw-left-1/2 tw-z-10 tw-h-11 tw-w-[104px] tw-origin-bottom -tw-translate-x-1/2 tw-transition-transform tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none ${compact ? "tw-scale-[0.88] sm:tw-scale-100" : "tw-scale-100"}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 104 44"
        className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-overflow-visible"
      >
        <path
          d="M0 36 C24 36 24 0 52 0 C80 0 80 36 104 36 L104 44 H0 Z"
          fill="#050706"
        />
        <path
          d="M0 36 C24 36 24 0 52 0 C80 0 80 36 104 36"
          fill="none"
          stroke="rgba(255,255,255,0.13)"
        />
      </svg>
      <button
        type="button"
        aria-label={t(locale, "newVersionToast.updateAction")}
        title={t(locale, "newVersionToast.updateAction")}
        onClick={refreshAppVersion}
        className="tw-pointer-events-auto tw-absolute tw-left-1/2 tw-top-0.5 tw-flex tw-size-9 -tw-translate-x-1/2 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-[#398351] tw-bg-[#062417] tw-p-1 tw-shadow-[0_0_12px_rgba(49,205,105,0.12)] focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#95ffad] active:tw-bg-[#103e26] desktop-hover:hover:tw-bg-[#103e26]"
      >
        {/* The local decorative rocket is shared with the reload screen. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/rocket-refresh-small.png"
          alt=""
          width={28}
          height={28}
          className="tw-size-7 tw-object-contain"
        />
      </button>
    </div>
  );
}
