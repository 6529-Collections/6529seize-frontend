"use client";

import { MOBILE_BOTTOM_NAV_DOCK_MEASUREMENT_WINDOW_MS } from "@/helpers/navigation.helpers";
import { refreshAppVersion } from "@/helpers/version-refresh.helpers";
import { useMeasuredMobileBottomNavDockBottom } from "@/hooks/useMeasuredMobileBottomNavDockBottom";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useVersionStatus } from "@/contexts/VersionStatusContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { t } from "@/i18n/messages";
import { type CSSProperties, type JSX } from "react";

const NEW_VERSION_TOAST_MOBILE_DOCK_QUERY = "(max-width: 639px)";
const NEW_VERSION_TOAST_MOBILE_BOTTOM_PROPERTY =
  "--new-version-toast-mobile-bottom";
const NEW_VERSION_TOAST_MOBILE_SCALE_PROPERTY =
  "--new-version-toast-mobile-scale";
const NEW_VERSION_TOAST_WEB_FALLBACK_BOTTOM = "1rem";
const NEW_VERSION_TOAST_APP_FALLBACK_BOTTOM = "6rem";
const NEW_VERSION_TOAST_FALLBACK_SCALE = "1";

type NewVersionToastStyle = CSSProperties & {
  readonly [NEW_VERSION_TOAST_MOBILE_BOTTOM_PROPERTY]: string;
  readonly [NEW_VERSION_TOAST_MOBILE_SCALE_PROPERTY]: string;
};

const getNewVersionToastStyle = (
  fallbackBottom: string
): NewVersionToastStyle =>
  ({
    [NEW_VERSION_TOAST_MOBILE_BOTTOM_PROPERTY]: fallbackBottom,
    [NEW_VERSION_TOAST_MOBILE_SCALE_PROPERTY]: NEW_VERSION_TOAST_FALLBACK_SCALE,
  }) as NewVersionToastStyle;

const SGT_WINK_IMAGE = (
  // react-doctor-disable-next-line react-doctor/nextjs-no-img-element restored plain img to preserve pre-existing decorative toast asset behavior.
  <img
    src="/emojis/sgt_wink.webp"
    alt=""
    className="tw-size-4 tw-flex-shrink-0 tw-self-end tw-opacity-85 sm:tw-size-[18px]"
  />
);

const ROCKET_REFRESH_IMAGE = (
  // react-doctor-disable-next-line react-doctor/nextjs-no-img-element restored plain img to avoid unrelated next/image optimization behavior in this dock-positioning PR.
  <img
    src="/rocket-refresh.png"
    alt=""
    className="tw-relative tw-z-10 tw-h-12 tw-w-auto tw-flex-shrink-0 tw-text-[#dfffe8] tw-transition-all tw-duration-200 tw-ease-out group-active:tw-scale-[0.985] desktop-hover:group-hover:tw-brightness-150 desktop-hover:group-hover:tw-saturate-150"
  />
);

const NewVersionToast = (): JSX.Element | null => {
  const isVersionStale = useVersionStatus();
  const { isApp } = useDeviceInfo();
  const locale = useBrowserLocale();
  const shouldTrackMobileDock = useMediaQuery(
    NEW_VERSION_TOAST_MOBILE_DOCK_QUERY
  );
  const usesNativeDockPosition = isApp;
  const usesCompactPill = isApp || shouldTrackMobileDock;
  const fallbackBottom = isApp
    ? NEW_VERSION_TOAST_APP_FALLBACK_BOTTOM
    : NEW_VERSION_TOAST_WEB_FALLBACK_BOTTOM;
  const toastLayerRef = useMeasuredMobileBottomNavDockBottom({
    enabled:
      isVersionStale && (usesNativeDockPosition || shouldTrackMobileDock),
    fallbackBottom,
    measurementWindowMs: MOBILE_BOTTOM_NAV_DOCK_MEASUREMENT_WINDOW_MS,
    resetOnDisabled: false,
    targetProperty: NEW_VERSION_TOAST_MOBILE_BOTTOM_PROPERTY,
    targetScaleProperty: NEW_VERSION_TOAST_MOBILE_SCALE_PROPERTY,
    watchForDockRoot: isApp,
  });

  if (!isVersionStale) {
    return null;
  }

  const refreshActionLabel = t(locale, "newVersionToast.refreshAction");
  const positionClassName = usesCompactPill
    ? "tw-bottom-[var(--new-version-toast-mobile-bottom,1rem)] tw-left-1/2 tw-right-auto tw-w-max tw-max-w-[calc(100vw-2rem)] -tw-translate-x-1/2 sm:tw-scale-100"
    : "tw-bottom-[var(--new-version-toast-mobile-bottom,1rem)] tw-left-4 tw-right-4 tw-w-auto sm:tw-bottom-7 sm:tw-left-auto sm:tw-right-7 sm:tw-scale-100";

  return (
    <div
      ref={toastLayerRef}
      style={getNewVersionToastStyle(fallbackBottom)}
      className={`tailwind-scope tw-pointer-events-none tw-fixed tw-z-[1000] tw-origin-bottom tw-scale-[var(--new-version-toast-mobile-scale,1)] tw-transform-gpu tw-will-change-[bottom,transform] ${positionClassName}`}
    >
      {usesCompactPill ? (
        <button
          type="button"
          aria-label={t(locale, "newVersionToast.updateAction")}
          title={t(locale, "newVersionToast.updateAction")}
          onClick={refreshAppVersion}
          className="tw-pointer-events-auto tw-flex tw-min-h-9 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-full tw-border tw-border-[#398351] tw-bg-[#062417]/95 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-50 tw-shadow-[inset_0_0_12px_rgba(49,205,105,0.12),_0_0_12px_rgba(49,205,105,0.12)] tw-backdrop-blur-xl tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#95ffad] focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black active:tw-bg-[#103e26] desktop-hover:hover:tw-bg-[#103e26]"
        >
          {/* Plain img preserves the existing local decorative asset behavior. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/rocket-refresh-small.png"
            alt=""
            width={24}
            height={24}
            className="tw-size-6 tw-shrink-0 tw-object-contain"
          />
          <span>{t(locale, "newVersionToast.update")}</span>
        </button>
      ) : (
        <button
          type="button"
          aria-label={refreshActionLabel}
          title={refreshActionLabel}
          onClick={refreshAppVersion}
          className="toast-shell tw-group tw-pointer-events-auto tw-relative tw-mx-auto tw-flex tw-w-full tw-animate-fadeIn tw-cursor-pointer tw-items-center tw-justify-between tw-gap-1 tw-overflow-hidden tw-rounded-[18px] tw-border-none tw-bg-[#15191b] tw-px-[18px] tw-py-2 tw-text-iron-50 tw-shadow-[0_0_0_1px_rgba(126,158,134,0.34),_0_2px_12px_rgba(0,0,0,0.36),_0_18px_40px_rgba(0,0,0,0.60),_0_0_34px_rgba(49,205,105,0.15),_inset_0_1px_0_rgba(255,255,255,0.07),_inset_0_-1px_0_rgba(49,205,105,0.08)] tw-backdrop-blur-xl tw-transition-[box-shadow,transform] tw-duration-200 tw-ease-out before:tw-pointer-events-none before:tw-absolute before:tw-inset-0 before:tw-origin-[82%_50%] before:tw-scale-95 before:tw-bg-[radial-gradient(circle_at_82%_50%,rgba(42,185,82,0.34),rgba(18,44,29,0.20)_32%,transparent_64%)] before:tw-opacity-0 before:tw-transition-[opacity,transform] before:tw-duration-200 before:tw-ease-out before:tw-content-[''] focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-[#95ffad] active:tw-scale-[0.985] desktop-hover:hover:tw-shadow-[0_0_0_1px_rgba(66,168,84,0.50),_0_2px_12px_rgba(0,0,0,0.34),_0_18px_40px_rgba(0,0,0,0.56),_0_0_16px_rgba(49,205,105,0.12),_inset_0_1px_0_rgba(153,255,176,0.12),_inset_0_0_20px_rgba(35,126,61,0.12)] desktop-hover:hover:before:tw-scale-100 desktop-hover:hover:before:tw-opacity-100 sm:tw-ml-auto sm:tw-mr-0 sm:tw-w-[372px]"
        >
          <div className="tw-relative tw-z-10 tw-min-w-0 tw-pr-1">
            <div className="tw-whitespace-nowrap tw-text-[15px] tw-font-bold tw-leading-tight tw-text-[#f5f7f6] sm:tw-text-base">
              {t(locale, "newVersionToast.title")}
            </div>
            <div className="tw-mt-0.5 tw-flex tw-items-center tw-gap-1 tw-text-[13px] tw-font-semibold tw-leading-none tw-text-[#b9c0c4] sm:tw-text-sm">
              <span>{t(locale, "newVersionToast.eyebrow")}</span>
              {SGT_WINK_IMAGE}
            </div>
          </div>

          <span className="tw-relative tw-z-10 tw-flex tw-h-14 tw-w-fit tw-flex-shrink-0 tw-items-center tw-justify-center">
            {ROCKET_REFRESH_IMAGE}
          </span>
        </button>
      )}
    </div>
  );
};

export default NewVersionToast;
