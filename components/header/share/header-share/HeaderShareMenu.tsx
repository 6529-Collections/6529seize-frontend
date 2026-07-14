"use client";

import { useElectron } from "@/hooks/useElectron";
import { t } from "@/i18n/messages";

import {
  getSubTabCount,
  getSubTabLabel,
  HEADER_SHARE_LOCALE,
  Mode,
  SubMode,
} from "./constants";

export function ModalMenu({
  activeTab,
  activeSubTab,
  onTabChange,
}: {
  readonly activeTab: Mode;
  readonly activeSubTab: SubMode;
  readonly onTabChange: (tab: Mode, subTab: SubMode) => void;
}) {
  const isElectron = useElectron() ?? false;
  const topTabCount = 2;
  const subTabCount = getSubTabCount(activeTab, isElectron);
  const subTabLabel = getSubTabLabel(activeTab);
  const getMenuButtonClass = (active: boolean) => {
    const baseClassName =
      "tw-inline-flex tw-h-10 tw-w-full tw-min-w-0 tw-items-center tw-justify-center tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-rounded-xl tw-border-0 tw-px-2 tw-text-[15px] tw-font-medium tw-transition tw-duration-200";

    if (active) {
      return `${baseClassName} tw-bg-iron-700 tw-text-iron-50`;
    }

    return `${baseClassName} tw-bg-iron-900 tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100`;
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <div className="tw-flex tw-flex-col tw-gap-1">
        <div className="tw-px-1 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.08em] tw-text-iron-500">
          {t(HEADER_SHARE_LOCALE, "headerShare.menu.shareType")}
        </div>
        <div
          className="tw-grid tw-gap-2"
          style={{
            gridTemplateColumns: `repeat(${topTabCount}, minmax(0, 1fr))`,
          }}
        >
          <button
            type="button"
            disabled={activeTab === Mode.SHARE}
            className={getMenuButtonClass(activeTab === Mode.SHARE)}
            onClick={() => onTabChange(Mode.SHARE, SubMode.APP)}
          >
            {t(HEADER_SHARE_LOCALE, "headerShare.menu.connection")}
          </button>
          <button
            type="button"
            disabled={activeTab === Mode.NAVIGATE}
            className={getMenuButtonClass(activeTab === Mode.NAVIGATE)}
            onClick={() => onTabChange(Mode.NAVIGATE, SubMode.APP)}
          >
            {t(HEADER_SHARE_LOCALE, "headerShare.menu.currentUrl")}
          </button>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-1">
        <div className="tw-px-1 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.08em] tw-text-iron-500">
          {subTabLabel}
        </div>
        <div
          className="tw-grid tw-gap-2"
          style={{
            gridTemplateColumns: `repeat(${subTabCount}, minmax(0, 1fr))`,
          }}
        >
          <button
            type="button"
            disabled={activeSubTab === SubMode.APP}
            className={getMenuButtonClass(activeSubTab === SubMode.APP)}
            onClick={() => onTabChange(activeTab, SubMode.APP)}
          >
            <span>{t(HEADER_SHARE_LOCALE, "headerShare.menu.mobile")}</span>
          </button>
          {activeTab === Mode.NAVIGATE && (
            <button
              type="button"
              disabled={activeSubTab === SubMode.BROWSER}
              className={getMenuButtonClass(activeSubTab === SubMode.BROWSER)}
              onClick={() => onTabChange(activeTab, SubMode.BROWSER)}
            >
              <span>{t(HEADER_SHARE_LOCALE, "headerShare.menu.browser")}</span>
            </button>
          )}
          {!isElectron && (
            <button
              type="button"
              disabled={activeSubTab === SubMode.CORE}
              className={getMenuButtonClass(activeSubTab === SubMode.CORE)}
              onClick={() => onTabChange(activeTab, SubMode.CORE)}
            >
              <span>{t(HEADER_SHARE_LOCALE, "headerShare.menu.desktop")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
