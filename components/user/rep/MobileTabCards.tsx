import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
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
    ? "tw-bg-iron-900 tw-shadow-[0_1px_2px_rgba(0,0,0,0.5)] tw-ring-1 tw-ring-inset tw-ring-white/[0.12]"
    : "tw-bg-transparent active:tw-bg-white/[0.04] desktop-hover:hover:tw-bg-white/[0.03]";
  const labelColorClasses = isSelected
    ? ACTIVE_LABEL_COLOR[tab]
    : "tw-text-iron-500";
  const valueColorClasses = isSelected ? "tw-text-white" : "tw-text-iron-300";

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onTabChange(tab)}
      className={`tw-flex tw-min-h-[60px] tw-min-w-0 tw-flex-auto tw-cursor-pointer tw-touch-manipulation tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-rounded-lg tw-border-0 tw-px-1.5 tw-py-2 tw-text-center tw-transition-[background-color,box-shadow] tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-300 motion-reduce:tw-transition-none @[340px]:tw-px-2.5 ${buttonStateClasses}`}
    >
      <span
        className={`tw-block tw-max-w-full tw-truncate tw-text-[11px] tw-font-medium tw-uppercase tw-leading-[15px] tw-tracking-[0.03em] tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none @[340px]:tw-leading-4 @[340px]:tw-tracking-[0.04em] ${labelColorClasses}`}
      >
        {label}
      </span>
      <span
        className={`tw-block tw-max-w-full tw-truncate tw-text-[13px] tw-font-semibold tw-tabular-nums tw-leading-[17px] tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none @[340px]:tw-text-sm @[340px]:tw-leading-[18px] ${valueColorClasses}`}
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
    <div className="tw-flex tw-gap-1 tw-rounded-xl tw-bg-white/[0.025] tw-p-1 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-@container">
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
