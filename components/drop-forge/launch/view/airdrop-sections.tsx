import DropForgeFieldBox from "@/components/drop-forge/DropForgeFieldBox";
import {
  BTN_METADATA_UPDATE_ACTION,
  BTN_SUBSCRIPTIONS_AIRDROP,
  DropForgeArweaveLinkValue,
  DropForgeSectionTitleWithToggle,
} from "@/components/drop-forge/launch/view/common";
import { findBestMatchingLaunchActionName } from "@/components/drop-forge/launch/drop-forge-launch-claim-page-client.helpers";
import type {
  DropForgeLaunchClaimPageViewProps,
  LaunchAirdropSummaryView,
  LaunchSubscriptionAirdropSectionView,
} from "@/components/drop-forge/launch/view/types";
import type { ApiMintingClaimAction } from "@/generated/models/ApiMintingClaimAction";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";

function DropForgeAirdropSummaryActionRow({
  title,
  loading,
  summary,
  isInitialized,
  disabled,
  buttonLabel,
  onClick,
  action,
  claimWritePending,
  actionPending,
  onActionToggle,
}: Readonly<{
  title: string;
  loading: boolean;
  summary: LaunchAirdropSummaryView;
  isInitialized: boolean;
  disabled: boolean;
  buttonLabel: string;
  onClick: () => void;
  action?: ApiMintingClaimAction | null;
  claimWritePending: boolean;
  actionPending: string | null;
  onActionToggle: (action: string, completed: boolean) => Promise<void>;
}>) {
  const isCompleted = action?.completed ?? false;
  const isActionToggleDisabled =
    !isInitialized || claimWritePending || actionPending !== null;

  return (
    <div className="tw-space-y-5">
      <DropForgeSectionTitleWithToggle
        title={title}
        action={action}
        toggleDisabled={isActionToggleDisabled}
        toggleAriaLabel={`${title} completed`}
        onActionToggle={onActionToggle}
      />
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
        <DropForgeFieldBox label="Address Count / Total Airdrops">
          {loading
            ? "loading / loading"
            : `${summary.addresses.toLocaleString()} / ${summary.totalAirdrops.toLocaleString()}`}
        </DropForgeFieldBox>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 lg:tw-self-end">
          <button
            type="button"
            disabled={disabled || isCompleted || actionPending !== null}
            onClick={onClick}
            className={BTN_SUBSCRIPTIONS_AIRDROP}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DropForgePhase0AirdropsSection({
  visible,
  phase0AirdropsError,
  phase0AirdropsLoading,
  isInitialized,
  claimWritePending,
  artistAirdropSummary,
  teamAirdropSummary,
  artistAirdrops,
  teamAirdrops,
  runAirdropWrite,
  mintingClaimActionsByName,
  mintingClaimActionPending,
  onMintingClaimActionToggle,
}: Readonly<{
  visible: boolean;
  phase0AirdropsError: string | null;
  phase0AirdropsLoading: boolean;
  isInitialized: boolean;
  claimWritePending: boolean;
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
}>) {
  if (!visible) {
    return null;
  }

  const availableActionNames = Object.keys(mintingClaimActionsByName);
  const artistActionName = findBestMatchingLaunchActionName(
    availableActionNames,
    "artist"
  );
  const teamActionName = findBestMatchingLaunchActionName(
    availableActionNames,
    "team"
  );
  const artistAction = artistActionName
    ? (mintingClaimActionsByName[artistActionName] ?? null)
    : null;
  const teamAction = teamActionName
    ? (mintingClaimActionsByName[teamActionName] ?? null)
    : null;

  return (
    <div className="tw-space-y-5 tw-pt-3">
      {phase0AirdropsError && (
        <p className="tw-mb-0 tw-text-sm tw-text-rose-300">
          {phase0AirdropsError}
        </p>
      )}

      <DropForgeAirdropSummaryActionRow
        title="Artist Airdrops"
        loading={phase0AirdropsLoading}
        summary={artistAirdropSummary}
        isInitialized={isInitialized}
        disabled={
          !isInitialized ||
          claimWritePending ||
          phase0AirdropsLoading ||
          artistAirdropSummary.totalAirdrops <= 0
        }
        buttonLabel={`Airdrop Artist x${artistAirdropSummary.totalAirdrops.toLocaleString()}`}
        onClick={() =>
          runAirdropWrite({
            entries: artistAirdrops,
            actionLabel: "Airdrop Artist",
            mintingClaimAction: artistActionName,
          })
        }
        action={artistAction}
        claimWritePending={claimWritePending}
        actionPending={mintingClaimActionPending}
        onActionToggle={onMintingClaimActionToggle}
      />

      <DropForgeAirdropSummaryActionRow
        title="Team Airdrops"
        loading={phase0AirdropsLoading}
        summary={teamAirdropSummary}
        isInitialized={isInitialized}
        disabled={
          !isInitialized ||
          claimWritePending ||
          phase0AirdropsLoading ||
          teamAirdropSummary.totalAirdrops <= 0
        }
        buttonLabel={`Airdrop Team x${teamAirdropSummary.totalAirdrops.toLocaleString()}`}
        onClick={() =>
          runAirdropWrite({
            entries: teamAirdrops,
            actionLabel: "Airdrop Team",
            mintingClaimAction: teamActionName,
          })
        }
        action={teamAction}
        claimWritePending={claimWritePending}
        actionPending={mintingClaimActionPending}
        onActionToggle={onMintingClaimActionToggle}
      />
    </div>
  );
}

export function DropForgeSubscriptionAirdropSections({
  sections,
  isInitialized,
  claimWritePending,
  runAirdropWrite,
  mintingClaimActionsByName,
  mintingClaimActionPending,
  onMintingClaimActionToggle,
}: Readonly<{
  sections: LaunchSubscriptionAirdropSectionView[];
  isInitialized: boolean;
  claimWritePending: boolean;
  runAirdropWrite: DropForgeLaunchClaimPageViewProps["runAirdropWrite"];
  mintingClaimActionsByName: Record<string, ApiMintingClaimAction>;
  mintingClaimActionPending: string | null;
  onMintingClaimActionToggle: (
    action: string,
    completed: boolean
  ) => Promise<void>;
}>) {
  if (sections.length === 0) {
    return null;
  }

  const availableActionNames = Object.keys(mintingClaimActionsByName);

  return (
    <div className="tw-space-y-5 tw-pt-3">
      {sections.map((section) => {
        const actionName = findBestMatchingLaunchActionName(
          availableActionNames,
          section.phaseKey
        );
        const action = actionName
          ? (mintingClaimActionsByName[actionName] ?? null)
          : null;
        const buttonLabel =
          section.airdropCount > 0
            ? `Airdrop Subscriptions x${section.airdropCount.toLocaleString()}`
            : "Airdrop Subscriptions";
        return (
          <div key={section.phaseKey} className="tw-space-y-5">
            {section.error ? (
              <p className="tw-mb-0 tw-text-sm tw-text-rose-300">
                {section.error}
              </p>
            ) : null}
            <DropForgeAirdropSummaryActionRow
              title={section.title}
              loading={section.loading}
              summary={section}
              isInitialized={isInitialized}
              disabled={
                !isInitialized ||
                claimWritePending ||
                section.loading ||
                section.airdropCount <= 0
              }
              buttonLabel={buttonLabel}
              onClick={() =>
                runAirdropWrite({
                  entries: section.airdropEntries,
                  actionLabel: "Airdrop Subscriptions",
                  mintingClaimAction: actionName,
                })
              }
              action={action}
              claimWritePending={claimWritePending}
              actionPending={mintingClaimActionPending}
              onActionToggle={onMintingClaimActionToggle}
            />
          </div>
        );
      })}
    </div>
  );
}

export function DropForgeMetadataUpdateSection({
  manifoldClaim,
  metadataLocation,
  claimWritePending,
  isInitialized,
  onUpdate,
}: Readonly<{
  manifoldClaim: ManifoldClaim | null;
  metadataLocation: string | null | undefined;
  claimWritePending: boolean;
  isInitialized: boolean;
  onUpdate: () => void;
}>) {
  return (
    <div className="tw-space-y-4">
      <div className="tw-text-base tw-font-semibold tw-text-white">
        Metadata Changed
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
        <DropForgeFieldBox
          label="On-Chain Metadata"
          contentClassName="tw-text-sm"
        >
          <span className="tw-block tw-max-w-full tw-truncate">
            <DropForgeArweaveLinkValue
              value={manifoldClaim?.location}
              truncate
            />
          </span>
        </DropForgeFieldBox>
        <DropForgeFieldBox
          label="Updated Metadata"
          contentClassName="tw-text-sm"
        >
          <span className="tw-block tw-max-w-full tw-truncate">
            <DropForgeArweaveLinkValue value={metadataLocation} truncate />
          </span>
        </DropForgeFieldBox>
        <button
          type="button"
          disabled={
            claimWritePending ||
            !isInitialized ||
            !manifoldClaim ||
            !metadataLocation
          }
          onClick={onUpdate}
          className={`${BTN_METADATA_UPDATE_ACTION} lg:tw-self-end`}
        >
          {claimWritePending ? "Processing..." : "Update On-Chain"}
        </button>
      </div>
    </div>
  );
}

export function DropForgeResearchAirdropSection({
  totalMinted,
  researchTargetEditionSize,
  researchTargetEditionSizeMax,
  onResearchTargetEditionSizeChange,
  claimWritePending,
  isInitialized,
  researchAirdropCount,
  runResearchAirdropWrite,
  researchAction,
  mintingClaimActionPending,
  onMintingClaimActionToggle,
}: Readonly<{
  totalMinted: number;
  researchTargetEditionSize: number;
  researchTargetEditionSizeMax: number | null;
  onResearchTargetEditionSizeChange: (value: string) => void;
  claimWritePending: boolean;
  isInitialized: boolean;
  researchAirdropCount: number;
  runResearchAirdropWrite: (mintingClaimAction: string | null) => void;
  researchAction?: ApiMintingClaimAction | null;
  mintingClaimActionPending: string | null;
  onMintingClaimActionToggle: (
    action: string,
    completed: boolean
  ) => Promise<void>;
}>) {
  const isCompleted = researchAction?.completed ?? false;
  const isActionToggleDisabled =
    !isInitialized || claimWritePending || mintingClaimActionPending !== null;
  const researchActionName = researchAction?.action ?? null;
  const researchButtonCountSuffix =
    researchAirdropCount > 0
      ? ` x${researchAirdropCount.toLocaleString()}`
      : "";

  return (
    <div className="tw-space-y-5 tw-pt-4">
      <DropForgeSectionTitleWithToggle
        title="Research Airdrop"
        action={researchAction}
        toggleDisabled={isActionToggleDisabled}
        toggleAriaLabel="Research airdrop completed"
        onActionToggle={onMintingClaimActionToggle}
      />
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:tw-items-start lg:tw-gap-x-5">
        <DropForgeFieldBox label="Total Minted">
          {totalMinted.toLocaleString()}
        </DropForgeFieldBox>
        <DropForgeFieldBox label="Target Edition Size">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max={researchTargetEditionSizeMax ?? undefined}
            step="1"
            value={researchTargetEditionSize}
            onChange={(e) => onResearchTargetEditionSizeChange(e.target.value)}
            className="tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-white [color-scheme:dark] focus:tw-outline-none focus:tw-ring-0"
          />
        </DropForgeFieldBox>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 lg:tw-self-end">
          <button
            type="button"
            disabled={
              claimWritePending ||
              mintingClaimActionPending !== null ||
              !isInitialized ||
              researchAirdropCount <= 0 ||
              isCompleted
            }
            onClick={() => runResearchAirdropWrite(researchActionName)}
            className={BTN_SUBSCRIPTIONS_AIRDROP}
          >
            {claimWritePending
              ? "Processing..."
              : `Airdrop to Research${researchButtonCountSuffix}`}
          </button>
        </div>
      </div>
    </div>
  );
}
