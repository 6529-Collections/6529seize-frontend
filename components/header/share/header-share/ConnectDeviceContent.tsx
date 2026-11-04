import {
  isAppDeviceGrantsEnabled,
  isSignedMessagesEnabled,
} from "@/lib/device-signing/feature";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { ModalMenu } from "./HeaderShareMenu";
import { HEADER_SHARE_LOCALE, SubMode } from "./constants";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Button from "@/components/utils/button/Button";
import { t } from "@/i18n/messages";
import Image from "next/image";
import { type ReactNode, useId, useLayoutEffect, useRef } from "react";
import { Tooltip } from "react-tooltip";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import type { HeaderShareModalViewProps } from "./HeaderShareModalView.types";

export function ConnectDeviceContent({
  account,
  children,
}: {
  readonly account: HeaderShareModalViewProps["account"];
  readonly children: ReactNode;
}) {
  const contentFrame = useRef<HTMLDivElement>(null);
  const contentBody = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const frame = contentFrame.current;
    const body = contentBody.current;
    if (!frame || !body || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      frame.style.height = `${body.offsetHeight}px`;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={contentFrame}
      className="tw-shrink-0 tw-overflow-hidden tw-transition-[height] tw-duration-200 tw-ease-out motion-reduce:tw-transition-none"
    >
      <div ref={contentBody} className="tw-flex tw-flex-col tw-gap-3">
        {account.address && (
          <div className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-bg-iron-900 tw-p-3">
            {account.pfp && (
              <Image
                unoptimized
                src={getScaledImageUri(account.pfp, ImageScale.W_200_H_200)}
                alt=""
                width={36}
                height={36}
                className="tw-size-9 tw-shrink-0 tw-rounded-full tw-object-cover"
              />
            )}
            <div className="tw-min-w-0">
              {account.handle && (
                <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
                  {account.handle}
                </p>
              )}
              <p className="tw-m-0 tw-break-all tw-font-mono tw-text-[11px] tw-text-iron-400">
                {account.address}
              </p>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ConnectDeviceFooter({
  onBack,
}: {
  readonly onBack: () => void;
}) {
  return (
    <div className="tw-flex tw-items-center tw-gap-2">
      <Button variant="secondary" size="sm" onClick={onBack}>
        <ArrowLeftIcon aria-hidden="true" className="tw-size-4" />
        {t(HEADER_SHARE_LOCALE, "headerShare.connectModal.back")}
      </Button>
      <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
        {t(HEADER_SHARE_LOCALE, "headerShare.connectModal.oneTime")}
      </p>
    </div>
  );
}

export function ConnectDeviceChoices({
  activeSubTab,
  isElectron,
  setActiveSubTab,
  canSetUp,
  setConnectionMode,
}: {
  readonly activeSubTab: SubMode;
  readonly isElectron: boolean;
  readonly setActiveSubTab: (tab: SubMode) => void;
  readonly canSetUp: boolean;
  readonly setConnectionMode: (mode: "only" | "secure") => void;
}) {
  const tooltipId = useId();
  const desktopSetupUnavailable = activeSubTab === SubMode.DESKTOP;
  const comingSoon = t(
    HEADER_SHARE_LOCALE,
    "headerShare.connectModal.desktopComingSoon"
  );

  return (
    <>
      <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
        {t(HEADER_SHARE_LOCALE, "headerShare.connectModal.chooseApp")}
      </p>
      <ModalMenu
        activeSubTab={activeSubTab}
        isElectron={isElectron}
        onSubTabChange={setActiveSubTab}
      />
      <Button
        variant="secondary"
        size="md"
        onClick={() => setConnectionMode("only")}
      >
        {t(HEADER_SHARE_LOCALE, "headerShare.connectModal.only")}
      </Button>
      {canSetUp &&
        isAppDeviceGrantsEnabled() &&
        isSignedMessagesEnabled() &&
        isE2eeEnabled() && (
          <>
            <Button
              variant="primary"
              size="md"
              className="!tw-h-auto tw-min-h-10 !tw-whitespace-normal tw-py-2 aria-disabled:!tw-cursor-not-allowed aria-disabled:tw-opacity-50"
              {...(desktopSetupUnavailable
                ? {
                    "aria-disabled": true,
                    "aria-description": comingSoon,
                    "data-tooltip-id": tooltipId,
                  }
                : { onClick: () => setConnectionMode("secure") })}
            >
              {t(HEADER_SHARE_LOCALE, "headerShare.connectModal.secure")}
            </Button>
            {desktopSetupUnavailable && (
              <Tooltip
                id={tooltipId}
                content={comingSoon}
                positionStrategy="fixed"
                place="top"
              />
            )}
          </>
        )}
    </>
  );
}
