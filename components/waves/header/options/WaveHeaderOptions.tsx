"use client";

import CommonDropdownItemsDefaultWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import { useWaveInformationPanel } from "@/components/brain/mobile/WaveInformationPanelContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { t } from "@/i18n/messages";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import WaveDelete from "./delete/WaveDelete";
import { useWaveDeleteFlow } from "./delete/WaveDeleteFlowContext";
import WaveProfileWaveAction from "./profile-wave/WaveProfileWaveAction";

export default function WaveHeaderOptions({
  wave,
  showOwnerActions,
}: {
  readonly wave: ApiWave;
  readonly showOwnerActions: boolean;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const locale = useBrowserLocale();
  const panel = useWaveInformationPanel(
    t(locale, "waves.header.ownerOptionsTitle")
  );
  const {
    isOpen: isOptionsOpen,
    open: openOptions,
    close: closeOptions,
  } = panel;
  const isMobileLayoutViewport = useIsMobileLayoutViewport();
  const useSheetActions = panel.isInSheet || isMobileLayoutViewport;
  const popupRole = isMobileLayoutViewport ? "dialog" : "menu";
  const { requestDelete, completeMobileOptionsLeave } = useWaveDeleteFlow();

  if (!showOwnerActions) {
    return null;
  }

  const handleDeleteRequest = () => {
    if (!panel.isInSheet) closeOptions();
    requestDelete(wave);
    // Embedded options have no separate sheet exit transition to wait for.
    if (panel.isInSheet) completeMobileOptionsLeave();
  };

  const setOptionsOpen = (isOpen: boolean) => {
    if (isOpen) openOptions(buttonRef.current);
    else closeOptions();
  };

  const actions = (
    <li className="tw-list-none">
      <div
        className={
          useSheetActions
            ? "tw-grid tw-grid-cols-1 tw-gap-y-2 tw-pb-4"
            : "tw-flex tw-flex-col tw-gap-y-0.5 tw-py-1"
        }
      >
        <WaveProfileWaveAction
          wave={wave}
          isMobile={useSheetActions}
          onSuccess={closeOptions}
        />
        <WaveDelete
          isMobile={useSheetActions}
          onDeleteRequest={handleDeleteRequest}
        />
      </div>
    </li>
  );

  let optionsSurface: ReactNode = null;
  if (panel.isInSheet) {
    if (isOptionsOpen && panel.container)
      optionsSurface = createPortal(
        <ul className="tw-m-0 tw-list-none tw-px-4">{actions}</ul>,
        panel.container
      );
  } else if (isMobileLayoutViewport) {
    optionsSurface = (
      <CommonDropdownItemsMobileWrapper
        isOpen={isOptionsOpen}
        setOpen={setOptionsOpen}
        label={t(locale, "waves.header.ownerOptionsTitle")}
        hideOnDesktopHover={false}
        onAfterLeave={completeMobileOptionsLeave}
      >
        {actions}
      </CommonDropdownItemsMobileWrapper>
    );
  } else {
    optionsSurface = (
      <CommonDropdownItemsDefaultWrapper
        isOpen={isOptionsOpen}
        setOpen={setOptionsOpen}
        buttonRef={buttonRef}
        menuId="wave-header-options-menu"
        menuLabelledBy="options-menu-0-button"
      >
        {actions}
      </CommonDropdownItemsDefaultWrapper>
    );
  }

  return (
    <>
      <div className="tw-relative tw-z-20 tw-flex tw-h-8 tw-items-center">
        <button
          ref={buttonRef}
          type="button"
          className="tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 tw-transition-all tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 active:tw-bg-iron-700 desktop-hover:tw-size-8 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-iron-400"
          id="options-menu-0-button"
          aria-expanded={isOptionsOpen}
          aria-controls={panel.isInSheet ? panel.contentId : undefined}
          aria-haspopup={panel.isInSheet ? undefined : popupRole}
          onClick={(e) => {
            e.stopPropagation();
            setOptionsOpen(!isOptionsOpen);
          }}
        >
          <span className="tw-sr-only">
            {t(locale, "waves.header.ownerOptionsOpenLabel")}
          </span>
          <EllipsisVerticalIcon
            className="tw-size-5 tw-flex-shrink-0"
            aria-hidden="true"
          />
        </button>
        {optionsSurface}
      </div>
    </>
  );
}
