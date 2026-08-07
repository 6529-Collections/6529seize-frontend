import { t } from "@/i18n/messages";

import {
  getConnectTargetCount,
  HEADER_SHARE_LOCALE,
  SubMode,
} from "./constants";

export function ModalMenu({
  activeSubTab,
  isElectron,
  onSubTabChange,
}: {
  readonly activeSubTab: SubMode;
  readonly isElectron: boolean;
  readonly onSubTabChange: (subTab: SubMode) => void;
}) {
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
    <fieldset className="tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-gap-1 tw-border-0 tw-p-0">
      <legend className="tw-px-1 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.08em] tw-text-iron-500">
        {t(HEADER_SHARE_LOCALE, "headerShare.menu.connectTo")}
      </legend>
      <div
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
    </fieldset>
  );
}
