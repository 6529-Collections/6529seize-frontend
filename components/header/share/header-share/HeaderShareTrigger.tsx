"use client";

import { Suspense, useState } from "react";

import ShareArrowIcon from "@/components/common/icons/ShareArrowIcon";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useCapacitor from "@/hooks/useCapacitor";
import { t } from "@/i18n/messages";
import { getActiveViewFromUrl } from "@/components/navigation/ViewContext";
import { usePathname, useSearchParams } from "next/navigation";
import { isPageShareSupported } from "../page-share-support";

import { HEADER_SHARE_LOCALE } from "./constants";
import { HeaderPageShareModal } from "./HeaderQRModal";

function HeaderShareContent({
  isCollapsed = false,
}: {
  readonly isCollapsed?: boolean | undefined;
}) {
  const capacitor = useCapacitor();
  const isMobileDevice = useIsMobileDevice();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const activeWaveId = getActiveWaveIdFromUrl({ pathname, searchParams });
  const activeView = getActiveViewFromUrl({
    activeWaveId,
    searchParams,
  });

  if (
    capacitor.isCapacitor ||
    isMobileDevice ||
    !isPageShareSupported({
      activeView,
      pathname,
      surface: "desktop-web",
    })
  ) {
    return <></>;
  }

  return (
    <div className="tailwind-scope tw-relative tw-px-3">
      <button
        type="button"
        aria-label={t(HEADER_SHARE_LOCALE, "headerShare.trigger.ariaLabel")}
        title={t(HEADER_SHARE_LOCALE, "headerShare.trigger.title")}
        onClick={() => setShowQRModal(true)}
        className={`tw-block tw-h-[2.875rem] tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-none tw-bg-transparent tw-px-2 tw-text-left tw-text-base tw-font-medium tw-text-iron-400 tw-no-underline tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 ${
          isCollapsed
            ? "desktop-hover:hover:tw-text-white"
            : "desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white"
        } active:tw-bg-transparent`}
        data-tooltip-id="sidebar-tooltip"
        data-tooltip-content={t(
          HEADER_SHARE_LOCALE,
          "headerShare.trigger.text"
        )}
        data-tooltip-hidden={!isCollapsed}
      >
        <div
          className={`tw-flex tw-h-full tw-w-full tw-items-center ${
            isCollapsed ? "" : "tw-gap-x-2"
          }`}
        >
          <div className="tw-flex tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center">
            <ShareArrowIcon className="tw-size-5 tw-flex-shrink-0" />
          </div>
          <span
            className={`tw-block tw-overflow-hidden tw-whitespace-nowrap tw-transition-all tw-duration-300 ${
              isCollapsed ? "tw-w-0 tw-opacity-0" : "tw-flex-1 tw-opacity-100"
            }`}
          >
            {t(HEADER_SHARE_LOCALE, "headerShare.trigger.text")}
          </span>
        </div>
      </button>
      <HeaderPageShareModal
        show={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  );
}

export default function HeaderShare({
  isCollapsed = false,
}: {
  readonly isCollapsed?: boolean | undefined;
}) {
  return (
    <Suspense fallback={null}>
      <HeaderShareContent isCollapsed={isCollapsed} />
    </Suspense>
  );
}
