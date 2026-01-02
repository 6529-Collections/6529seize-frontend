"use client";

import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import { AllowlistOperationCode } from "@/components/allowlist-tool/allowlist-tool.types";
import BuildPhase from "./build-phase/BuildPhase";
import AllowlistToolAnimationWrapper from "@/components/allowlist-tool/common/animation/AllowlistToolAnimationWrapper";
import AllowlistToolAnimationOpacity from "@/components/allowlist-tool/common/animation/AllowlistToolAnimationOpacity";

export interface BuildPhasesPhase {
  readonly id: string;
  readonly allowlistId: string;
  readonly name: string;
  readonly description: string;
  readonly hasRan: boolean;
  readonly order: number;
  readonly components: BuildPhasesPhaseComponent[];
}

export interface BuildPhasesPhaseComponent {
  id: string;
  allowlistId: string;
  name: string;
  description: string;
  spotsNotRan: boolean;
  spots: number | null;
  order: number;
}

export default function BuildPhases() {
  const { operations, phases, setStep, runOperations } = useContext(
    DistributionPlanToolContext
  );
  const [phasesByOp, setPhasesByOp] = useState<BuildPhasesPhase[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<BuildPhasesPhase | null>();
  useEffect(() => {
    const createPhasesOperations = operations.filter(
      (operation) => operation.code === AllowlistOperationCode.ADD_PHASE
    );
    setPhasesByOp(
      createPhasesOperations.map((phaseOp) => ({
        id: phaseOp.params["id"],
        allowlistId: phaseOp.allowlistId,
        name: phaseOp.params["name"],
        description: phaseOp.params["description"],
        hasRan: phaseOp.hasRan,
        order: phaseOp.order,
        components: operations
          .filter(
            (operation) =>
              operation.code === AllowlistOperationCode.ADD_COMPONENT &&
              operation.params["phaseId"] === phaseOp.params["id"]
          )
          .map((operation) => ({
            id: operation.params["id"],
            allowlistId: operation.allowlistId,
            name: operation.params["name"],
            description: operation.params["description"],
            order: operation.order,
            spotsNotRan: operations.some(
              (operation2) =>
                [
                  AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS,
                  AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_WALLETS_EXCLUDING_CERTAIN_COMPONENTS,
                ].includes(operation2.code) &&
                operation2.params["componentId"] === operation.params["id"] &&
                !operation2.hasRan
            ),
            spots:
              phases
                .find((p) => p.id === phaseOp.params["id"])
                ?.components.find((c) => c.id === operation.params["id"])
                ?.winnersSpotsCount || null,
          })),
      }))
    );
  }, [operations, phases]);

  useEffect(() => {
    if (!phasesByOp.length) return;
    if (selectedPhase) {
      setSelectedPhase(phasesByOp.find((p) => p.id === selectedPhase.id));
      return;
    }
    setSelectedPhase(phasesByOp.at(0));
  }, [phasesByOp, selectedPhase]);

  const onNextStep = async () => {
    const index = phasesByOp.findIndex((p) => p.id === selectedPhase?.id);
    if (index === -1) return;
    if (index === phasesByOp.length - 1) {
      const haveNotRan = operations.some((op) => !op.hasRan);
      if (haveNotRan) {
        await runOperations();
      }
      setStep(DistributionPlanToolStep.MAP_DELEGATIONS);
      return;
    }
    setSelectedPhase(phasesByOp.at(index + 1));
  };

  return (
    <>
      {selectedPhase && (
        <AllowlistToolAnimationWrapper mode="wait" initial={true}>
          <AllowlistToolAnimationOpacity
            key={`selected-phase-${selectedPhase.id}`}>
            <BuildPhase
              onNextStep={onNextStep}
              selectedPhase={selectedPhase}
              phases={phasesByOp}
            />
          </AllowlistToolAnimationOpacity>
        </AllowlistToolAnimationWrapper>
      )}
    </>
  );
}
