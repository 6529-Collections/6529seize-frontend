import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import { formatNumberWithCommas } from "@/helpers/Helpers";

export type MobileTab = "rep" | "nic" | "statements";

const SELECTED_BUTTON_CLASSES: Record<MobileTab, string> = {
  rep: "tw-border-primary-500/30 tw-bg-primary-500/10 tw-shadow-[0_0_15px_rgba(64,106,254,0.10)]",
  nic: "tw-border-emerald-500/30 tw-bg-emerald-500/10 tw-shadow-[0_0_15px_rgba(16,185,129,0.10)]",
  statements:
    "tw-border-white/20 tw-bg-white/10 tw-shadow-[0_0_15px_rgba(255,255,255,0.05)]",
};

const SELECTED_LABEL_CLASSES: Record<MobileTab, string> = {
  rep: "tw-text-primary-400",
  nic: "tw-text-emerald-400",
  statements: "tw-text-iron-300",
};

function MobileTabButton({
  tab,
  label,
  accessibleLabel,
  value,
  activeTab,
  onTabChange,
}: {
  readonly tab: MobileTab;
  readonly label: string;
  readonly accessibleLabel?: string;
  readonly value: string;
  readonly activeTab: MobileTab;
  readonly onTabChange: (tab: MobileTab) => void;
}) {
  const isSelected = activeTab === tab;
  const selectedButtonClasses = SELECTED_BUTTON_CLASSES[tab];
  const horizontalPaddingClasses =
    tab === "statements" ? "tw-px-0" : "tw-px-0 min-[360px]:tw-px-1";
  const labelColorClasses = isSelected
    ? SELECTED_LABEL_CLASSES[tab]
    : "tw-text-iron-500";
  const valueColorClasses = isSelected
    ? "tw-text-white"
    : "tw-text-iron-400";
  return (
    <button
      type="button"
      aria-label={accessibleLabel}
      aria-pressed={isSelected}
      onClick={() => onTabChange(tab)}
      className={`tw-flex tw-min-w-0 tw-cursor-pointer tw-flex-col tw-items-center tw-justify-center tw-gap-0.5 tw-rounded-lg tw-border tw-border-solid tw-py-2.5 tw-text-center tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-300 active:tw-bg-white/[0.06] motion-reduce:tw-transition-none ${horizontalPaddingClasses} ${
        isSelected
          ? selectedButtonClasses
          : "tw-border-transparent tw-bg-transparent desktop-hover:hover:tw-bg-white/[0.035]"
      }`}
    >
      <span
        className={`tw-flex tw-max-w-full tw-items-center tw-justify-center tw-gap-1 tw-text-[0.625rem] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-normal min-[360px]:tw-text-[0.6875rem] min-[360px]:tw-tracking-wider ${labelColorClasses}`}
      >
        <span className="tw-min-w-0 tw-whitespace-nowrap">{label}</span>
      </span>
      <span
        className={`tw-max-w-full tw-truncate tw-text-xl tw-font-semibold tw-leading-none tw-tracking-tight tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none ${valueColorClasses}`}
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
  const identityStatementValue =
    identityStatementCount === null
      ? "\u2014"
      : formatNumberWithCommas(identityStatementCount);
  const nicValue = cicOverview?.total_cic ?? profile.cic;

  return (
    <div className="tw-grid tw-grid-cols-[0.95fr_0.65fr_1.4fr] tw-gap-1 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.05] tw-p-1.5 min-[360px]:tw-grid-cols-[1fr_0.8fr_1.2fr] sm:tw-grid-cols-3">
      <MobileTabButton
        tab="rep"
        label="TOTAL REP"
        value={overview ? formatNumberWithCommas(overview.total_rep) : "\u2014"}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      <MobileTabButton
        tab="nic"
        label="NIC"
        value={formatNumberWithCommas(nicValue)}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      <MobileTabButton
        tab="statements"
        label="ID Statements"
        accessibleLabel={`ID Statements ${identityStatementValue}`}
        value={identityStatementValue}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </div>
  );
}
