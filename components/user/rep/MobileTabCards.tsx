import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { t } from "@/i18n/messages";

export type MobileTab = "rep" | "nic" | "statements";

const ACTIVE_LABEL_COLOR: Record<MobileTab, string> = {
  rep: "tw-text-primary-300",
  nic: "tw-text-emerald-300",
  statements: "tw-text-iron-100",
};

function MobileTabButton({
  tab,
  label,
  activeTab,
  disabled,
  onTabChange,
}: {
  readonly tab: MobileTab;
  readonly label: string;
  readonly activeTab: MobileTab;
  readonly disabled: boolean;
  readonly onTabChange: (tab: MobileTab) => void;
}) {
  const isSelected = activeTab === tab;
  const buttonStateClasses = isSelected
    ? "tw-bg-iron-900 tw-shadow-[0_1px_2px_rgba(0,0,0,0.5)] tw-ring-1 tw-ring-inset tw-ring-white/[0.12]"
    : "tw-bg-transparent active:tw-bg-white/[0.04] desktop-hover:hover:tw-bg-white/[0.03]";
  const labelColorClasses = isSelected
    ? ACTIVE_LABEL_COLOR[tab]
    : "tw-text-iron-500";

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={isSelected}
      onClick={() => onTabChange(tab)}
      className={`tw-flex tw-min-h-11 tw-min-w-0 tw-flex-auto tw-cursor-pointer tw-touch-manipulation tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-rounded-lg tw-border-0 tw-px-1.5 tw-py-2 tw-text-center tw-transition-[background-color,box-shadow] tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-300 @[340px]:tw-px-2.5 motion-reduce:tw-transition-none ${buttonStateClasses}`}
    >
      <span
        className={`tw-block tw-max-w-full tw-truncate tw-text-[11px] tw-font-medium tw-uppercase tw-leading-[15px] tw-tracking-[0.03em] tw-transition-colors tw-duration-200 @[340px]:tw-leading-4 @[340px]:tw-tracking-[0.04em] motion-reduce:tw-transition-none ${labelColorClasses}`}
      >
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
  const hasHydrated = useHasHydrated();
  return (
    <div
      role="group"
      aria-label={t(locale, "user.profile.identity.mobileTabs.label")}
      className="tw-flex tw-gap-1 tw-rounded-xl tw-bg-white/[0.025] tw-p-1 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-@container"
    >
      <MobileTabButton
        tab="rep"
        label={t(locale, "user.profile.identity.mobileTabs.rep")}
        activeTab={activeTab}
        disabled={!hasHydrated}
        onTabChange={onTabChange}
      />
      <MobileTabButton
        tab="nic"
        label={t(locale, "user.profile.identity.mobileTabs.nic")}
        activeTab={activeTab}
        disabled={!hasHydrated}
        onTabChange={onTabChange}
      />
      <MobileTabButton
        tab="statements"
        label={t(locale, "user.profile.identity.mobileTabs.idStatements")}
        activeTab={activeTab}
        disabled={!hasHydrated}
        onTabChange={onTabChange}
      />
    </div>
  );
}
