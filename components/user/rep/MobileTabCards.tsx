import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

export type MobileTab = "rep" | "nic" | "statements";

const ACTIVE_TAB_STYLES: Record<
  MobileTab,
  Readonly<{
    button: string;
    label: string;
    pressed: string;
  }>
> = {
  rep: {
    button: "tw-bg-primary-500/10",
    label: "tw-text-primary-300",
    pressed: "active:tw-bg-primary-500/20",
  },
  nic: {
    button: "tw-bg-emerald-500/10",
    label: "tw-text-emerald-300",
    pressed: "active:tw-bg-emerald-500/20",
  },
  statements: {
    button: "tw-bg-emerald-500/10",
    label: "tw-text-emerald-300",
    pressed: "active:tw-bg-emerald-500/20",
  },
};

function MobileTabButton({
  tab,
  label,
  value,
  activeTab,
  onTabChange,
}: {
  readonly tab: MobileTab;
  readonly label: string;
  readonly value: string;
  readonly activeTab: MobileTab;
  readonly onTabChange: (tab: MobileTab) => void;
}) {
  const isSelected = activeTab === tab;
  const activeStyles = ACTIVE_TAB_STYLES[tab];
  const buttonStateClasses = isSelected
    ? `${activeStyles.button} ${activeStyles.pressed}`
    : "tw-bg-transparent active:tw-bg-white/[0.06] desktop-hover:hover:tw-bg-white/[0.03]";
  const labelColorClasses = isSelected
    ? `${activeStyles.label} tw-font-bold`
    : "tw-font-semibold tw-text-iron-400";
  const valueColorClasses = isSelected ? "tw-text-white" : "tw-text-iron-300";

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onTabChange(tab)}
      className={`tw-relative tw-flex tw-min-h-16 tw-min-w-0 tw-cursor-pointer tw-touch-manipulation tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-border-b-0 tw-border-l tw-border-r-0 tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-px-2 tw-py-2.5 tw-text-center tw-transition-colors tw-duration-150 first:tw-border-l-0 focus-visible:tw-z-10 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-300 motion-reduce:tw-transition-none ${buttonStateClasses}`}
    >
      <span
        className={`tw-block tw-w-full tw-max-w-full tw-truncate tw-text-lg tw-font-semibold tw-leading-none tw-tracking-tight tw-transition-colors tw-duration-150 motion-reduce:tw-transition-none ${valueColorClasses}`}
      >
        {value}
      </span>
      <span
        className={`tw-block tw-w-full tw-max-w-full tw-truncate tw-text-[0.625rem] tw-uppercase tw-leading-4 tw-tracking-normal min-[360px]:tw-text-[0.6875rem] min-[360px]:tw-tracking-wider ${labelColorClasses}`}
      >
        {label}
      </span>
    </button>
  );
}

export default function MobileTabCards({
  activeTab,
  onTabChange,
  overview,
  cicOverview,
  profile,
  identityStatementCount,
}: {
  readonly activeTab: MobileTab;
  readonly onTabChange: (tab: MobileTab) => void;
  readonly overview: ApiRepOverview | null;
  readonly cicOverview: ApiCicOverview | null;
  readonly profile: ApiIdentity;
  readonly identityStatementCount: number | null;
}) {
  const locale = useBrowserLocale();
  const identityStatementValue =
    identityStatementCount === null
      ? "\u2014"
      : formatInteger(locale, identityStatementCount);
  const nicValue = cicOverview?.total_cic ?? profile.cic;

  return (
    <div className="tw-grid tw-grid-cols-3 tw-overflow-hidden tw-rounded-xl tw-bg-white/[0.035] tw-ring-1 tw-ring-inset tw-ring-white/[0.09]">
      <MobileTabButton
        tab="rep"
        label={t(locale, "user.profile.identity.mobileTabs.totalRep")}
        value={overview ? formatInteger(locale, overview.total_rep) : "\u2014"}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      <MobileTabButton
        tab="nic"
        label={t(locale, "user.profile.identity.mobileTabs.nic")}
        value={formatInteger(locale, nicValue)}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      <MobileTabButton
        tab="statements"
        label={t(locale, "user.profile.identity.mobileTabs.idStatements")}
        value={identityStatementValue}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </div>
  );
}
