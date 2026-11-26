import PillTab from "@/components/common/PillTab";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { t } from "@/i18n/messages";

export type MobileTab = "rep" | "nic" | "statements";

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
  return (
    <PillTab
      active={isSelected}
      disabled={disabled}
      aria-pressed={isSelected}
      onClick={() => onTabChange(tab)}
      className="tw-uppercase"
    >
      {label}
    </PillTab>
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
      className="tw-flex tw-flex-wrap tw-gap-1"
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
