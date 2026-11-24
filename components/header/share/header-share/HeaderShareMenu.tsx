import { t } from "@/i18n/messages";

import { HEADER_SHARE_LOCALE, SubMode } from "./constants";

const CONNECT_TARGETS = [
  { tab: SubMode.MOBILE, label: "headerShare.menu.mobile" },
  { tab: SubMode.DESKTOP, label: "apps.newDesktop.title" },
  { tab: SubMode.DESKTOP_CLASSIC, label: "headerShare.menu.desktop" },
] as const;

export function ModalMenu({
  activeSubTab,
  isElectron,
  onSubTabChange,
}: {
  readonly activeSubTab: SubMode;
  readonly isElectron: boolean;
  readonly onSubTabChange: (subTab: SubMode) => void;
}) {
  const targets = isElectron ? CONNECT_TARGETS.slice(0, 1) : CONNECT_TARGETS;
  const getMenuButtonClass = (active: boolean) => {
    const baseClassName =
      "tw-inline-flex tw-min-h-10 tw-w-full tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-xl tw-border-0 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-transition tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-300";

    if (active) {
      return `${baseClassName} tw-bg-iron-700 tw-text-iron-50`;
    }

    return `${baseClassName} tw-bg-iron-900 tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100`;
  };

  return (
    <fieldset className="tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-gap-1 tw-border-0 tw-p-0 tw-@container">
      <legend className="tw-sr-only">
        {t(HEADER_SHARE_LOCALE, "headerShare.menu.deviceType")}
      </legend>
      <div
        className={`tw-grid tw-gap-2 ${isElectron ? "" : "@[32rem]:tw-grid-cols-3"}`}
      >
        {targets.map(({ tab, label }) => (
          <button
            key={tab}
            type="button"
            aria-pressed={activeSubTab === tab}
            className={getMenuButtonClass(activeSubTab === tab)}
            onClick={() => onSubTabChange(tab)}
          >
            {t(HEADER_SHARE_LOCALE, label)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
