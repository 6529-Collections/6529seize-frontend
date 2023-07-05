import { useContext, useEffect, useState } from "react";
import DistributionPlanSecondaryText from "../../../common/DistributionPlanSecondaryText";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import SelectSnapshot from "./component-config/SelectSnapshot";
import { DistributionPlanToolContext } from "../../../DistributionPlanToolContext";
import { AllowlistToolSelectMenuOption } from "../../../../allowlist-tool/common/select-menu/AllowlistToolSelectMenu";
import {
  AllowlistOperationCode,
  AllowlistPhaseWithComponentAndItems,
} from "../../../../allowlist-tool/allowlist-tool.types";
import SnapshotExcludeComponentWinners from "./component-config/SnapshotExcludeComponentWinners";
import { BuildPhasesPhase } from "../../BuildPhases";
import SnapshotSelectTopHolders from "./component-config/SnapshotSelectTopHolders";
import SnapshotAskExcludeComponentWinners from "./component-config/SnapshotAskExcludeComponentWinners";
import SnapshotAskSelectTopHolders from "./component-config/SnapshotAskSelectTopHolders";
import SnapshotSelectTopHoldersByTotalTokensCount from "./component-config/SnapshotSelectTopHoldersByTotalTokensCount";
import SnapshotSelectTopHoldersByUniqueTokensCount from "./component-config/SnapshotSelectTopHoldersByUniqueTokensCount";
import SnapshotAskSelectRandomHolders from "./component-config/SnapshotAskSelectRandomHolders";
import SnapshotSelectRandomHolders from "./component-config/SnapshotSelectRandomHolders";
import FinalizeSnapshot from "./component-config/FinalizeSnapshot";
import ComponentAskSelectRandomHolders from "./component-config/ComponentAskSelectRandomHolders";
import ComponentSelectRandomHolders from "./component-config/ComponentSelectRandomHolders";
import ComponentAddSpots from "./component-config/ComponentAddSpots";
import FinalizeComponent from "./component-config/FinalizeComponent";

export enum PhaseConfigStep {
  SELECT_SNAPSHOT = "SELECT_SNAPSHOT",
  SNAPSHOT_ASK_EXCLUDE_COMPONENT_WINNERS = "SNAPSHOT_ASK_EXCLUDE_COMPONENT_WINNERS",
  SNAPSHOT_EXCLUDE_COMPONENT_WINNERS = "SNAPSHOT_EXCLUDE_COMPONENT_WINNERS",
  SNAPSHOT_ASK_SELECT_TOP_HOLDERS = "SNAPSHOT_ASK_SELECT_TOP_HOLDERS",
  SNAPSHOT_SELECT_TOP_HOLDERS = "SNAPSHOT_SELECT_TOP_HOLDERS",
  SNAPSHOT_SELECT_TOP_HOLDERS_BY_TOTAL_TOKENS_COUNT = "SNAPSHOT_SELECT_TOP_HOLDERS_BY_TOTAL_TOKENS_COUNT",
  SNAPSHOT_SELECT_TOP_HOLDERS_BY_UNIQUE_TOKENS_COUNT = "SNAPSHOT_SELECT_TOP_HOLDERS_BY_UNIQUE_TOKENS_COUNT",
  SNAPSHOT_ASK_SELECT_RANDOM_HOLDERS = "SNAPSHOT_ASK_SELECT_RANDOM_HOLDERS",
  SNAPSHOT_SELECT_RANDOM_HOLDERS = "SNAPSHOT_SELECT_RANDOM_HOLDERS",
  FINALIZE_SNAPSHOT = "FINALIZE_SNAPSHOT",
  COMPONENT_ASK_SELECT_RANDOM_HOLDERS = "COMPONENT_ASK_SELECT_RANDOM_HOLDERS",
  COMPONENT_SELECT_RANDOM_HOLDERS = "COMPONENT_SELECT_RANDOM_HOLDERS",
  COMPONENT_ADD_SPOTS = "COMPONENT_ADD_SPOTS",
  FINALIZE_COMPONENTS = "FINALIZE_COMPONENTS",
}

export default function BuildPhaseFormConfigModal({
  name,
  description,
  selectedPhase,
  phases,
}: {
  name: string;
  description: string;
  selectedPhase: BuildPhasesPhase;
  phases: BuildPhasesPhase[];
}) {
  const [configStep, setConfigStep] = useState<PhaseConfigStep>(
    PhaseConfigStep.SELECT_SNAPSHOT
  );
  const { operations } = useContext(DistributionPlanToolContext);
  const [targetPhases, setTargetPhases] = useState<BuildPhasesPhase[]>([]);

  useEffect(() => {
    const currentPhaseIndex = phases.findIndex(
      (p) => p.id === selectedPhase.id
    );
    setTargetPhases(phases.slice(0, currentPhaseIndex + 1));
  }, [selectedPhase, phases]);

  const [snapshots, setSnapshots] = useState<AllowlistToolSelectMenuOption[]>(
    []
  );

  useEffect(() => {
    const tokenPools = operations
      .filter(
        (operation) =>
          operation.code === AllowlistOperationCode.CREATE_TOKEN_POOL
      )
      .map((operation) => ({
        value: operation.params.id,
        title: operation.params.name,
        subTitle: "Snapshot",
      }));

    const customTokenPools = operations
      .filter(
        (operation) =>
          operation.code === AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL
      )
      .map((operation) => ({
        value: operation.params.id,
        title: operation.params.name,
        subTitle: "Custom Snapshot",
      }));

    setSnapshots([...tokenPools, ...customTokenPools]);
  }, [operations]);

  const onNextStep = (step: PhaseConfigStep) => setConfigStep(step);

  return (
    <div className="tw-px-6 tw-pt-6 tw-gap-y-6 tw-flex tw-flex-col tw-divide-y tw-divide-solid tw-divide-neutral-700 tw-divide-x-0">
      {(() => {
        switch (configStep) {
          case PhaseConfigStep.SELECT_SNAPSHOT:
            return (
              <SelectSnapshot snapshots={snapshots} onNextStep={onNextStep} />
            );
          case PhaseConfigStep.SNAPSHOT_ASK_EXCLUDE_COMPONENT_WINNERS:
            return (
              <SnapshotAskExcludeComponentWinners onNextStep={onNextStep} />
            );
          case PhaseConfigStep.SNAPSHOT_EXCLUDE_COMPONENT_WINNERS:
            return (
              <SnapshotExcludeComponentWinners
                phases={targetPhases}
                onNextStep={onNextStep}
              />
            );
          case PhaseConfigStep.SNAPSHOT_ASK_SELECT_TOP_HOLDERS:
            return <SnapshotAskSelectTopHolders onNextStep={onNextStep} />;
          case PhaseConfigStep.SNAPSHOT_SELECT_TOP_HOLDERS:
            return <SnapshotSelectTopHolders onNextStep={onNextStep} />;
          case PhaseConfigStep.SNAPSHOT_SELECT_TOP_HOLDERS_BY_TOTAL_TOKENS_COUNT:
            return (
              <SnapshotSelectTopHoldersByTotalTokensCount
                onNextStep={onNextStep}
              />
            );
          case PhaseConfigStep.SNAPSHOT_SELECT_TOP_HOLDERS_BY_UNIQUE_TOKENS_COUNT:
            return (
              <SnapshotSelectTopHoldersByUniqueTokensCount
                onNextStep={onNextStep}
              />
            );
          case PhaseConfigStep.SNAPSHOT_ASK_SELECT_RANDOM_HOLDERS:
            return <SnapshotAskSelectRandomHolders onNextStep={onNextStep} />;
          case PhaseConfigStep.SNAPSHOT_SELECT_RANDOM_HOLDERS:
            return <SnapshotSelectRandomHolders onNextStep={onNextStep} />;
          case PhaseConfigStep.FINALIZE_SNAPSHOT:
            return <FinalizeSnapshot onNextStep={onNextStep} />;
          case PhaseConfigStep.COMPONENT_ASK_SELECT_RANDOM_HOLDERS:
            return <ComponentAskSelectRandomHolders onNextStep={onNextStep} />;
          case PhaseConfigStep.COMPONENT_SELECT_RANDOM_HOLDERS:
            return <ComponentSelectRandomHolders onNextStep={onNextStep} />;
          case PhaseConfigStep.COMPONENT_ADD_SPOTS:
            return <ComponentAddSpots onNextStep={onNextStep} />;
          case PhaseConfigStep.FINALIZE_COMPONENTS:
            return (
              <FinalizeComponent
                onSave={() => undefined}
                onStartAgain={() => undefined}
              />
            );
          default:
            assertUnreachable(configStep);
        }
      })()}
      {/* <div className="tw-grid tw-grid-cols-2">
        <div className="tw-col-span-2">
          <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
            Exclude from
          </label>
          <div className="tw-mt-2">
            <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-500">
              <input
                type="text"
                className="tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
                placeholder="Select"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="tw-pt-6 tw-grid tw-grid-cols-2 tw-gap-4">
        <div className="tw-col-span-2">
          <fieldset>
            <div className="tw-space-y-4 sm:tw-flex sm:tw-items-center sm:tw-space-x-10 sm:tw-space-y-0">
              <div className="tw-flex tw-items-center">
                <input
                  id="email"
                  name="notification-method"
                  type="radio"
                  checked
                  className="tw-h-4 tw-w-4 tw-py-3 tw-px-3 placeholder:tw-text-neutral-500 tw-border-neutral-300 tw-text-primary-500 focus:tw-ring-primary-500"
                />
                <label className="tw-ml-3 tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-neutral-100">
                  Total cards
                </label>
              </div>
              <div className="tw-flex tw-items-center">
                <input
                  id="email"
                  name="notification-method"
                  type="radio"
                  checked
                  className="tw-h-4 tw-w-4 tw-py-3 tw-px-3 placeholder:tw-text-neutral-500 tw-border-neutral-300 tw-text-primary-500 focus:tw-ring-primary-500"
                />
                <label className="tw-ml-3 tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-neutral-100">
                  Total unique cards
                </label>
              </div>
              <div className="tw-flex tw-items-center">
                <input
                  id="email"
                  name="notification-method"
                  type="radio"
                  checked
                  className="tw-h-4 tw-w-4 tw-py-3 tw-px-3 placeholder:tw-text-neutral-500 tw-border-neutral-300 tw-text-primary-500 focus:tw-ring-primary-500"
                />
                <label className="tw-ml-3 tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-neutral-100">
                  Total TDH
                </label>
              </div>
            </div>
          </fieldset>
        </div>
        <div className="col-span-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
            From
          </label>
          <div className="tw-mt-2">
            <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-500">
              <input
                type="text"
                className="tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
                placeholder="From 1 to 150"
              />
            </div>
          </div>
        </div>
        <div className="col-span-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
            To
          </label>
          <div className="tw-mt-2">
            <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-500">
              <input
                type="text"
                className="tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
                placeholder="To 1 to 150"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="tw-pt-6 tw-grid tw-grid-cols-2 tw-gap-4">
        <div className="tw-col-span-2">
          <fieldset>
            <div className="tw-space-y-4 sm:tw-flex sm:tw-items-center sm:tw-space-x-10 sm:tw-space-y-0">
              <div className="tw-flex tw-items-center">
                <input
                  id="email"
                  name="notification-method"
                  type="radio"
                  checked
                  className="tw-h-4 tw-w-4 tw-py-3 tw-px-3 placeholder:tw-text-neutral-500 tw-border-neutral-300 tw-text-primary-500 focus:tw-ring-primary-500"
                />
                <label className="tw-ml-3 tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-neutral-100">
                  All
                </label>
              </div>
              <div className="tw-flex tw-items-center">
                <input
                  id="email"
                  name="notification-method"
                  type="radio"
                  checked
                  className="tw-h-4 tw-w-4 tw-py-3 tw-px-3 placeholder:tw-text-neutral-500 tw-border-neutral-300 tw-text-primary-500 focus:tw-ring-primary-500"
                />
                <label className="tw-ml-3 tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-neutral-100">
                  Random
                </label>
              </div>
            </div>
          </fieldset>
        </div>
        <div className="col-span-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-white">
            Up to
          </label>
          <div className="tw-mt-2">
            <div className="tw-flex tw-rounded-md tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-500">
              <input
                type="text"
                className="tw-flex-1 tw-border-0 tw-bg-transparent placeholder:tw-text-neutral-500 tw-py-3 tw-px-3 tw-text-white focus:tw-ring-0 sm:tw-text-sm sm:tw-leading-6"
                placeholder="Up to 100 wallets"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="tw-pt-6 tw-w-full">
        <button
          type="submit"
          className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-font-medium tw-text-base tw-text-white tw-w-full tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          Next
        </button>
      </div> */}
    </div>
  );
}
