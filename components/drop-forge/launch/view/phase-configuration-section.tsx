import DropForgeFieldBox from "@/components/drop-forge/DropForgeFieldBox";
import {
  findBestMatchingLaunchActionName,
  getRootAddressesCount,
  getRootTotalSpots,
  type LaunchPhaseKey,
} from "@/components/drop-forge/launch/drop-forge-launch-claim-page-client.helpers";
import {
  BTN_SUBSCRIPTIONS_AIRDROP,
  DropForgePhaseDateTimeField,
} from "@/components/drop-forge/launch/view/common";
import {
  DropForgePhase0AirdropsSection,
  DropForgeResearchAirdropSection,
  DropForgeSubscriptionAirdropSections,
} from "@/components/drop-forge/launch/view/airdrop-sections";
import { DropForgePayArtistSection } from "@/components/drop-forge/launch/view/pay-artist-section";
import type {
  DropForgeLaunchClaimPageViewProps,
  LaunchAirdropSummaryView,
  RenderSelectedPhasePanelProps,
  LaunchPhaseSelectionSectionProps,
  LaunchPhaseConfigView,
  LaunchPhaseDiffsView,
  LaunchSubscriptionAirdropSectionView,
} from "@/components/drop-forge/launch/view/types";
import type { ApiMintingClaimAction } from "@/generated/models/ApiMintingClaimAction";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";

const LAUNCH_PHASE_TAB_BASE_CLASSES =
  "tw-inline-flex tw-h-12 tw-w-full tw-items-center tw-justify-center tw-rounded-xl tw-border-0 tw-px-4 tw-text-center tw-text-sm tw-font-semibold tw-transition tw-duration-150";
const LAUNCH_PHASE_TAB_ACTIVE_CLASSES =
  "tw-bg-primary-500 tw-text-white tw-shadow-[0_12px_28px_rgba(59,130,246,0.28)]";
const LAUNCH_PHASE_TAB_INACTIVE_CLASSES =
  "tw-bg-iron-900/80 tw-text-iron-200 enabled:hover:tw-bg-iron-800 enabled:hover:tw-text-iron-50";
const LAUNCH_PHASE_TAB_DISABLED_CLASSES =
  "disabled:tw-cursor-not-allowed disabled:tw-bg-iron-900/50 disabled:tw-text-iron-500";

interface LaunchPhaseTabDefinition {
  readonly key: LaunchPhaseKey;
  readonly label: string;
  readonly subLabel?: string;
  readonly alwaysEnabled?: boolean;
}

const LAUNCH_PHASE_TABS: readonly LaunchPhaseTabDefinition[] = [
  {
    key: "phase0",
    label: "Phase 0",
    subLabel: "- Initialize",
    alwaysEnabled: true,
  },
  { key: "phase1", label: "Phase 1" },
  { key: "phase2", label: "Phase 2" },
  { key: "publicphase", label: "Public Phase" },
  { key: "research", label: "Airdrop Research" },
  { key: "payartist", label: "Pay Artist" },
];

function LaunchPhaseTabButton({
  tab,
  selectedPhase,
  isInitialized,
  onSelectedPhaseChange,
}: Readonly<{
  tab: LaunchPhaseTabDefinition;
  selectedPhase: "" | LaunchPhaseKey;
  isInitialized: boolean;
  onSelectedPhaseChange: (value: LaunchPhaseKey) => void;
}>) {
  const isSelected = selectedPhase === tab.key;
  const disabled = !tab.alwaysEnabled && !isInitialized;
  const stateClass = isSelected
    ? LAUNCH_PHASE_TAB_ACTIVE_CLASSES
    : LAUNCH_PHASE_TAB_INACTIVE_CLASSES;
  const gapClass = tab.subLabel ? " tw-gap-1" : "";
  const disabledClass = tab.alwaysEnabled
    ? ""
    : ` ${LAUNCH_PHASE_TAB_DISABLED_CLASSES}`;
  const className = `${LAUNCH_PHASE_TAB_BASE_CLASSES}${gapClass} ${stateClass}${disabledClass}`;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      aria-controls={`phase-panel-${tab.key}`}
      disabled={disabled}
      onClick={() => onSelectedPhaseChange(tab.key)}
      className={className}
    >
      {tab.subLabel ? (
        <>
          <span>{tab.label}</span>
          <span className="tw-hidden lg:tw-inline">{tab.subLabel}</span>
        </>
      ) : (
        tab.label
      )}
    </button>
  );
}

function renderSelectedPhasePanel({
  phasePanelProps,
  selectedPhase,
  researchAction,
  payArtistAction,
}: Readonly<RenderSelectedPhasePanelProps>) {
  if (selectedPhase === "research") {
    return (
      <DropForgeResearchAirdropSection
        {...phasePanelProps}
        researchAction={researchAction}
      />
    );
  }

  if (selectedPhase === "payartist") {
    return (
      <DropForgePayArtistSection
        {...phasePanelProps}
        payArtistAction={payArtistAction}
      />
    );
  }

  return (
    <DropForgePhaseConfigurationSection
      {...phasePanelProps}
      selectedPhase={selectedPhase}
    />
  );
}

function DropForgePhaseRootInfoSection({
  isPublicPhaseSelected,
  selectedPhaseDiffs,
  changedFieldBoxClassName,
  changedFieldBoxLabelClassName,
  rootsLoading,
  selectedPhaseConfig,
}: Readonly<{
  isPublicPhaseSelected: boolean;
  selectedPhaseDiffs: LaunchPhaseDiffsView;
  changedFieldBoxClassName: string;
  changedFieldBoxLabelClassName: string;
  rootsLoading: boolean;
  selectedPhaseConfig: LaunchPhaseConfigView | null;
}>) {
  if (isPublicPhaseSelected) {
    return null;
  }

  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-pt-3 lg:tw-grid-cols-2 lg:tw-gap-x-5">
      <DropForgeFieldBox
        label="Merkle Root"
        className={
          selectedPhaseDiffs.merkleRoot ? changedFieldBoxClassName : ""
        }
        labelClassName={
          selectedPhaseDiffs.merkleRoot ? changedFieldBoxLabelClassName : ""
        }
        contentClassName="tw-break-all tw-text-sm"
      >
        <span>
          {rootsLoading && !selectedPhaseConfig?.root ? (
            <span className="tw-text-iron-400">loading</span>
          ) : (
            (selectedPhaseConfig?.root?.merkle_root ?? (
              <span className="tw-text-rose-300">missing</span>
            ))
          )}
        </span>
      </DropForgeFieldBox>
      <DropForgeFieldBox label="Address Count / Total Spots">
        {rootsLoading && !selectedPhaseConfig?.root ? (
          <span className="tw-text-iron-400">loading / loading</span>
        ) : (
          <span className="tw-inline-flex tw-items-center">
            <span>
              {getRootAddressesCount(selectedPhaseConfig?.root) ?? (
                <span className="tw-text-rose-300">missing</span>
              )}
            </span>
            <span className="tw-px-1">/</span>
            <span>
              {getRootTotalSpots(selectedPhaseConfig?.root) ?? (
                <span className="tw-text-rose-300">missing</span>
              )}
            </span>
          </span>
        )}
      </DropForgeFieldBox>
    </div>
  );
}

function DropForgePhaseConfigurationSection({
  manifoldClaim,
  selectedPhaseDiffs,
  changedFieldBoxClassName,
  changedFieldBoxLabelClassName,
  selectedPhasePriceValue,
  onSelectedPhasePriceChange,
  selectedPhase,
  isPublicPhaseSelected,
  rootsLoading,
  selectedPhaseConfig,
  selectedPhaseWindowStartValue,
  selectedPhaseWindowEndValue,
  onSelectedPhaseStartChange,
  onSelectedPhaseEndChange,
  selectedPhaseActionDisabled,
  onSelectedPhaseAction,
  selectedPhaseActionLabel,
  claimWritePending,
  showPhase0AirdropSections,
  phase0AirdropsError,
  phase0AirdropsLoading,
  isInitialized,
  artistAirdropSummary,
  teamAirdropSummary,
  artistAirdrops,
  teamAirdrops,
  runAirdropWrite,
  mintingClaimActionsByName,
  mintingClaimActionPending,
  onMintingClaimActionToggle,
  subscriptionAirdropSections,
}: Readonly<{
  manifoldClaim: ManifoldClaim | null;
  selectedPhaseDiffs: LaunchPhaseDiffsView;
  changedFieldBoxClassName: string;
  changedFieldBoxLabelClassName: string;
  selectedPhasePriceValue: string;
  onSelectedPhasePriceChange: (value: string) => void;
  selectedPhase: "" | LaunchPhaseKey;
  isPublicPhaseSelected: boolean;
  rootsLoading: boolean;
  selectedPhaseConfig: LaunchPhaseConfigView | null;
  selectedPhaseWindowStartValue: string;
  selectedPhaseWindowEndValue: string;
  onSelectedPhaseStartChange: (value: string) => void;
  onSelectedPhaseEndChange: (value: string) => void;
  selectedPhaseActionDisabled: boolean;
  onSelectedPhaseAction: () => void;
  selectedPhaseActionLabel: string;
  claimWritePending: boolean;
  showPhase0AirdropSections: boolean;
  phase0AirdropsError: string | null;
  phase0AirdropsLoading: boolean;
  isInitialized: boolean;
  artistAirdropSummary: LaunchAirdropSummaryView;
  teamAirdropSummary: LaunchAirdropSummaryView;
  artistAirdrops: PhaseAirdrop[] | null;
  teamAirdrops: PhaseAirdrop[] | null;
  runAirdropWrite: DropForgeLaunchClaimPageViewProps["runAirdropWrite"];
  mintingClaimActionsByName: Record<string, ApiMintingClaimAction>;
  mintingClaimActionPending: string | null;
  onMintingClaimActionToggle: (
    action: string,
    completed: boolean
  ) => Promise<void>;
  subscriptionAirdropSections: LaunchSubscriptionAirdropSectionView[];
}>) {
  return (
    <div className="tw-space-y-5 tw-pt-2">
      <div className="tw-text-base tw-font-medium tw-text-white">
        Phase Configuration
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2 lg:tw-gap-x-5">
        <DropForgeFieldBox label="Remaining Editions">
          {manifoldClaim?.remaining ?? "—"}
        </DropForgeFieldBox>
        <DropForgeFieldBox
          label="Cost (ETH)"
          className={selectedPhaseDiffs.cost ? changedFieldBoxClassName : ""}
          labelClassName={
            selectedPhaseDiffs.cost ? changedFieldBoxLabelClassName : ""
          }
        >
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.00001"
            value={selectedPhase ? selectedPhasePriceValue : ""}
            onChange={(e) => onSelectedPhasePriceChange(e.target.value)}
            disabled={!selectedPhase}
            className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-text-iron-500"
          />
        </DropForgeFieldBox>
      </div>

      <DropForgePhaseRootInfoSection
        isPublicPhaseSelected={isPublicPhaseSelected}
        selectedPhaseDiffs={selectedPhaseDiffs}
        changedFieldBoxClassName={changedFieldBoxClassName}
        changedFieldBoxLabelClassName={changedFieldBoxLabelClassName}
        rootsLoading={rootsLoading}
        selectedPhaseConfig={selectedPhaseConfig}
      />

      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-pt-3 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
        <DropForgePhaseDateTimeField
          label="Phase Start"
          value={selectedPhaseWindowStartValue}
          onChange={onSelectedPhaseStartChange}
          isPhaseSelected={Boolean(selectedPhase)}
          changed={selectedPhaseDiffs.startDate}
          changedFieldBoxClassName={changedFieldBoxClassName}
          changedFieldBoxLabelClassName={changedFieldBoxLabelClassName}
        />
        <DropForgePhaseDateTimeField
          label="Phase End"
          value={selectedPhaseWindowEndValue}
          onChange={onSelectedPhaseEndChange}
          isPhaseSelected={Boolean(selectedPhase)}
          changed={selectedPhaseDiffs.endDate}
          changedFieldBoxClassName={changedFieldBoxClassName}
          changedFieldBoxLabelClassName={changedFieldBoxLabelClassName}
        />
        <button
          type="button"
          disabled={selectedPhaseActionDisabled}
          onClick={onSelectedPhaseAction}
          className={`${BTN_SUBSCRIPTIONS_AIRDROP} lg:tw-self-end`}
        >
          {claimWritePending ? "Processing..." : selectedPhaseActionLabel}
        </button>
      </div>

      <DropForgePhase0AirdropsSection
        visible={showPhase0AirdropSections}
        phase0AirdropsError={phase0AirdropsError}
        phase0AirdropsLoading={phase0AirdropsLoading}
        isInitialized={isInitialized}
        claimWritePending={claimWritePending}
        artistAirdropSummary={artistAirdropSummary}
        teamAirdropSummary={teamAirdropSummary}
        artistAirdrops={artistAirdrops}
        teamAirdrops={teamAirdrops}
        runAirdropWrite={runAirdropWrite}
        mintingClaimActionsByName={mintingClaimActionsByName}
        mintingClaimActionPending={mintingClaimActionPending}
        onMintingClaimActionToggle={onMintingClaimActionToggle}
      />

      <DropForgeSubscriptionAirdropSections
        sections={subscriptionAirdropSections}
        isInitialized={isInitialized}
        claimWritePending={claimWritePending}
        runAirdropWrite={runAirdropWrite}
        mintingClaimActionsByName={mintingClaimActionsByName}
        mintingClaimActionPending={mintingClaimActionPending}
        onMintingClaimActionToggle={onMintingClaimActionToggle}
      />
    </div>
  );
}

export function DropForgePhaseSelectionSection({
  phasePanelProps,
  phaseSelectionProps: { selectedPhase, onSelectedPhaseChange },
}: Readonly<LaunchPhaseSelectionSectionProps>) {
  const researchActionName = findBestMatchingLaunchActionName(
    Object.keys(phasePanelProps.mintingClaimActionsByName),
    "research"
  );
  const researchAction = researchActionName
    ? (phasePanelProps.mintingClaimActionsByName[researchActionName] ?? null)
    : null;
  const payArtistActionName = findBestMatchingLaunchActionName(
    Object.keys(phasePanelProps.mintingClaimActionsByName),
    "payartist"
  );
  const payArtistAction = payArtistActionName
    ? (phasePanelProps.mintingClaimActionsByName[payArtistActionName] ?? null)
    : null;

  return (
    <>
      <div className="tw-text-base tw-font-semibold tw-text-iron-50">
        Phase Selection
      </div>
      <div
        role="tablist"
        aria-label="Phase selection"
        className="tw-grid tw-grid-cols-2 tw-gap-2 tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950/70 tw-p-2 sm:tw-grid-cols-3 lg:tw-grid-cols-6"
      >
        {LAUNCH_PHASE_TABS.map((tab) => (
          <LaunchPhaseTabButton
            key={tab.key}
            tab={tab}
            selectedPhase={selectedPhase}
            isInitialized={phasePanelProps.isInitialized}
            onSelectedPhaseChange={onSelectedPhaseChange}
          />
        ))}
      </div>
      <div className="tw-min-h-[18rem] lg:tw-min-h-[30rem]">
        {renderSelectedPhasePanel({
          phasePanelProps,
          selectedPhase,
          researchAction,
          payArtistAction,
        })}
      </div>
    </>
  );
}
