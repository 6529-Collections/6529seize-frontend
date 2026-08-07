"use client";

import { useElectron } from "@/hooks/useElectron";
import { t } from "@/i18n/messages";

import {
  getConnectTargetCount,
  HEADER_SHARE_LOCALE,
  SubMode,
} from "./constants";

export function ModalMenu({
  activeSubTab,
  onSubTabChange,
}: {
  readonly activeSubTab: SubMode;
  readonly onSubTabChange: (subTab: SubMode) => void;
}) {
  const isElectron = useElectron() ?? false;
  const subTabCount = getConnectTargetCount(isElectron);
  const getMenuButtonClass = (active: boolean) => {
    const baseClassName =
      "tw-inline-flex tw-h-10 tw-w-full tw-min-w-0 tw-items-center tw-justify-center tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-rounded-xl tw-border-0 tw-px-2 tw-text-[15px] tw-font-medium tw-transition tw-duration-200";

    if (active) {
      return `${baseClassName} tw-bg-iron-700 tw-text-iron-50`;
    }

    return `${baseClassName} tw-bg-iron-900 tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100`;
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-1">
      <div
        id="header-share-connect-target-label"
        className="tw-px-1 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.08em] tw-text-iron-500"
      >
        {t(HEADER_SHARE_LOCALE, "headerShare.menu.connectTo")}
      </div>
      <div
        role="group"
        aria-labelledby="header-share-connect-target-label"
        className="tw-grid tw-gap-2"
        style={{
          gridTemplateColumns: `repeat(${subTabCount}, minmax(0, 1fr))`,
        }}
      >
        <button
          type="button"
          aria-pressed={activeSubTab === SubMode.MOBILE}
          className={getMenuButtonClass(activeSubTab === SubMode.MOBILE)}
          onClick={() => onSubTabChange(SubMode.MOBILE)}
        >
          <span>{t(HEADER_SHARE_LOCALE, "headerShare.menu.mobile")}</span>
        </button>
        {!isElectron && (
          <button
            type="button"
            aria-pressed={activeSubTab === SubMode.DESKTOP}
            className={getMenuButtonClass(activeSubTab === SubMode.DESKTOP)}
            onClick={() => onSubTabChange(SubMode.DESKTOP)}
          >
            <span>{t(HEADER_SHARE_LOCALE, "headerShare.menu.desktop")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
