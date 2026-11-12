import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  CONNECTED_TAB_INTERACTION_CLASSES,
  CONNECTED_TAB_SURFACE_CLASSES,
  getConnectedTabStateClasses,
} from "@/components/utils/select/tabs/connectedTabStyles";

export type MobileTab = "rep" | "nic" | "statements";

function MobileTabButton({
  tab,
  label,
  activeTab,
  onTabChange,
}: {
  readonly tab: MobileTab;
  readonly label: string;
  readonly activeTab: MobileTab;
  readonly onTabChange: (tab: MobileTab) => void;
}) {
  const isSelected = activeTab === tab;
  const buttonStateClasses = getConnectedTabStateClasses({
    isActive: isSelected,
  });

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onTabChange(tab)}
      className={`tw-flex tw-min-h-11 tw-min-w-0 tw-flex-auto tw-touch-manipulation tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-rounded-md tw-border-0 tw-px-1.5 tw-py-2 tw-text-center @[340px]:tw-px-2.5 ${CONNECTED_TAB_INTERACTION_CLASSES} ${buttonStateClasses}`}
    >
      <span className="tw-block tw-max-w-full tw-truncate tw-text-[11px] tw-font-medium tw-uppercase tw-leading-[15px] tw-tracking-[0.03em] tw-transition-colors tw-duration-150 @[340px]:tw-leading-4 @[340px]:tw-tracking-[0.04em] motion-reduce:tw-transition-none">
        {label}
      </span>
    </button>
  );
}

export default function MobileTabCards({
  activeTab,
  onTabChange,
}: {
  readonly activeTab: MobileTab;
  readonly onTabChange: (tab: MobileTab) => void;
}) {
  const locale = useBrowserLocale();
  return (
    <div
      role="group"
      aria-label={t(locale, "user.profile.identity.mobileTabs.label")}
      className={`tw-flex tw-gap-1 tw-p-1 tw-ring-1 tw-ring-inset tw-@container ${CONNECTED_TAB_SURFACE_CLASSES}`}
    >
      <MobileTabButton
        tab="rep"
        label={t(locale, "user.profile.identity.mobileTabs.rep")}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      <MobileTabButton
        tab="nic"
        label={t(locale, "user.profile.identity.mobileTabs.nic")}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      <MobileTabButton
        tab="statements"
        label={t(locale, "user.profile.identity.mobileTabs.idStatements")}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </div>
  );
}
