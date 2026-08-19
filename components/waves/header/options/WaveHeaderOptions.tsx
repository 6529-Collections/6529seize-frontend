"use client";

import CommonDropdownItemsDefaultWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { t } from "@/i18n/messages";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
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
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const locale = useBrowserLocale();
  const isMobileLayoutViewport = useIsMobileLayoutViewport();
  const { requestDelete, completeMobileOptionsLeave } = useWaveDeleteFlow();

  if (!showOwnerActions) {
    return null;
  }

  const handleDeleteRequest = () => {
    setIsOptionsOpen(false);
    requestDelete(wave);
  };

  const actions = (
    <li className="tw-list-none">
      <div
        className={
          isMobileLayoutViewport
            ? "tw-grid tw-grid-cols-1 tw-gap-y-2 tw-pb-4"
            : "tw-flex tw-flex-col tw-gap-y-0.5 tw-py-1"
        }
      >
        <WaveProfileWaveAction
          wave={wave}
          isMobile={isMobileLayoutViewport}
          onSuccess={() => setIsOptionsOpen(false)}
        />
        <WaveDelete
          isMobile={isMobileLayoutViewport}
          onDeleteRequest={handleDeleteRequest}
        />
      </div>
    </li>
  );

  return (
    <>
      <div className="tw-relative tw-z-20">
        <button
          ref={buttonRef}
          type="button"
          className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-500 tw-transition-all tw-duration-200 active:tw-bg-iron-700 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-iron-300"
          id="options-menu-0-button"
          aria-expanded={isOptionsOpen}
          aria-haspopup={isMobileLayoutViewport ? "dialog" : "menu"}
          onClick={(e) => {
            e.stopPropagation();
            setIsOptionsOpen((open) => !open);
          }}
        >
          <span className="tw-sr-only">
            {t(locale, "waves.header.ownerOptionsOpenLabel")}
          </span>
          <EllipsisVerticalIcon
            className="tw-size-4 tw-flex-shrink-0"
            aria-hidden="true"
          />
        </button>
        {isMobileLayoutViewport ? (
          <CommonDropdownItemsMobileWrapper
            isOpen={isOptionsOpen}
            setOpen={setIsOptionsOpen}
            label={t(locale, "waves.header.ownerOptionsTitle")}
            hideOnDesktopHover={false}
            onAfterLeave={completeMobileOptionsLeave}
          >
            {actions}
          </CommonDropdownItemsMobileWrapper>
        ) : (
          <CommonDropdownItemsDefaultWrapper
            isOpen={isOptionsOpen}
            setOpen={setIsOptionsOpen}
            buttonRef={buttonRef}
            menuId="wave-header-options-menu"
            menuLabelledBy="options-menu-0-button"
          >
            {actions}
          </CommonDropdownItemsDefaultWrapper>
        )}
      </div>
    </>
  );
}
