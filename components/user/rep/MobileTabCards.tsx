import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

export type MobileTab = "rep" | "nic" | "statements";

const SELECTED_BUTTON_CLASSES: Record<MobileTab, string> = {
  rep: "tw-border-primary-500/30 tw-bg-primary-500/10",
  nic: "tw-border-emerald-500/30 tw-bg-emerald-500/10",
  statements: "tw-border-emerald-500/30 tw-bg-emerald-500/10",
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
  const buttonStateClasses = isSelected
    ? SELECTED_BUTTON_CLASSES[tab]
    : "tw-border-transparent tw-bg-transparent desktop-hover:hover:tw-bg-white/[0.035]";
  const labelColorClasses = isSelected
    ? "tw-text-iron-300"
    : "tw-text-iron-500";
  let valueColorClasses = isSelected ? "tw-text-white" : "tw-text-iron-400";
  if (tab === "rep" && isSelected) {
    valueColorClasses = "tw-text-primary-400";
  }
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onTabChange(tab)}
      className={`tw-flex tw-min-h-16 tw-flex-auto tw-cursor-pointer tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-rounded-lg tw-border tw-border-solid tw-px-0 tw-py-2.5 tw-text-center tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-300 active:tw-bg-white/[0.08] motion-reduce:tw-transition-none ${buttonStateClasses}`}
    >
      <span
        className={`tw-flex tw-max-w-full tw-items-center tw-justify-center tw-gap-1 tw-text-[0.625rem] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-normal min-[360px]:tw-text-[0.6875rem] min-[360px]:tw-tracking-wider ${labelColorClasses}`}
      >
        <span className="tw-min-w-0 tw-whitespace-nowrap">{label}</span>
      </span>
      <span
        className={`tw-whitespace-nowrap tw-text-xl tw-font-semibold tw-leading-none tw-tracking-tight tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none ${valueColorClasses}`}
      >
        {value}
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
    <div className="tw-overflow-x-auto tw-overflow-y-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.05] tw-scrollbar-none">
      <div className="tw-flex tw-w-max tw-min-w-full tw-gap-1 tw-p-1.5">
        <MobileTabButton
          tab="rep"
          label={t(locale, "user.profile.identity.mobileTabs.totalRep")}
          value={
            overview ? formatInteger(locale, overview.total_rep) : "\u2014"
          }
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
    </div>
  );
}
